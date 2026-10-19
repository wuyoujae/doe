//! One OpenAI-style image request. The host owns durable jobs and asset commits.
use super::prepare_image;
use crate::models::{ModelOptions, ResolvedModel};
use base64::{Engine, engine::general_purpose::STANDARD};
use image::{ImageFormat, ImageReader, Limits};
use reqwest::{Client, Response, Url};
use serde_json::{Map, Value, json};
use std::{
    io::Cursor,
    net::{IpAddr, SocketAddr},
    time::Duration,
};
use tokio::sync::watch;

pub const MAX_IMAGE_BYTES: usize = 20 * 1024 * 1024;
const MAX_RESPONSE_BYTES: usize = 29 * 1024 * 1024;
const MAX_PIXELS: u64 = 40_000_000;

pub struct GeneratedImage {
    pub bytes: Vec<u8>,
    pub mime: &'static str,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, thiserror::Error)]
#[error("{message}")]
pub struct ImageError {
    pub code: &'static str,
    pub message: &'static str,
    /// A request may have reached the provider; automatic regeneration is unsafe.
    pub uncertain: bool,
}

fn error(code: &'static str, message: &'static str, uncertain: bool) -> ImageError {
    ImageError {
        code,
        message,
        uncertain,
    }
}

async fn cancelled(cancel: &mut watch::Receiver<bool>) {
    loop {
        if *cancel.borrow_and_update() {
            return;
        }
        if cancel.changed().await.is_err() {
            return;
        }
    }
}

pub async fn generate(
    model: &ResolvedModel,
    prompt: &str,
    ratio: &str,
    remove_background: bool,
    mut cancel: watch::Receiver<bool>,
) -> Result<GeneratedImage, ImageError> {
    if *cancel.borrow() {
        return Err(error("cancelled", "Image generation was cancelled.", false));
    }
    if prompt.trim().is_empty() || prompt.chars().count() > 16_000 || prompt.contains('\0') {
        return Err(error(
            "image_prompt_invalid",
            "Image prompts must contain 1 to 16000 characters.",
            false,
        ));
    }
    let mut prepared = prepare_image(model, prompt).map_err(|_| {
        error(
            "image_model_not_configured",
            "Configure a valid image model in Settings.",
            false,
        )
    })?;
    let mut body: Value = prepared
        .request
        .body()
        .and_then(|body| body.as_bytes())
        .and_then(|body| serde_json::from_slice(body).ok())
        .ok_or_else(|| {
            error(
                "image_request_invalid",
                "The image request is invalid.",
                false,
            )
        })?;
    configure_body(&mut body, model, ratio, remove_background)?;
    if is_agnes(model) && prepared.request.url().path() == "/images/generations" {
        prepared
            .request
            .url_mut()
            .set_path("/v1/images/generations");
    }
    *prepared.request.body_mut() = Some(
        serde_json::to_vec(&body)
            .map_err(|_| {
                error(
                    "image_request_invalid",
                    "The image request is invalid.",
                    false,
                )
            })?
            .into(),
    );
    tokio::select! {
        biased;
        _ = cancelled(&mut cancel) => Err(error("cancelled", "Image generation was cancelled; the provider may already have processed it.", true)),
        result = async {
            let response = prepared.client.execute(prepared.request).await.map_err(|_| error(
                "image_request_uncertain", "The image provider did not finish responding. Check the provider before retrying.", true,
            ))?;
            if !response.status().is_success() {
                return Err(provider_error(response).await);
            }
            let encoded = bounded_body(response, MAX_RESPONSE_BYTES).await?;
            let payload: Value = serde_json::from_slice(&encoded).map_err(|_| error(
                "image_response_invalid", "The image provider returned an invalid response.", true,
            ))?;
            let source = parse_source(&payload)?;
            let bytes = match source {
                ImageSource::Inline(bytes) => bytes,
                ImageSource::Remote(url) => download(&url, &model.endpoint.options).await?,
            };
            tokio::task::spawn_blocking(move || validate_image(bytes, remove_background)).await
                .map_err(|_| error("image_decode_failed", "The generated image could not be validated.", true))?
        } => result,
    }
}

fn dimensions(ratio: &str) -> Result<(u32, u32), ImageError> {
    match ratio {
        "1:1" => Ok((1024, 1024)),
        "4:3" => Ok((1152, 864)),
        "3:4" => Ok((864, 1152)),
        "4:5" => Ok((1024, 1280)),
        "16:9" => Ok((1536, 864)),
        "9:16" => Ok((864, 1536)),
        _ => Err(error(
            "image_ratio_invalid",
            "Choose one of the supported image aspect ratios.",
            false,
        )),
    }
}

pub fn supports_transparency(model: &ResolvedModel) -> bool {
    let name = model.endpoint.model.to_ascii_lowercase();
    matches!(model.endpoint.provider.as_str(), "openai" | "custom")
        && (name.starts_with("gpt-image-") || name == "chatgpt-image-latest")
}

fn is_agnes(model: &ResolvedModel) -> bool {
    let Ok(url) = Url::parse(&model.endpoint.base_url) else {
        return false;
    };
    model.endpoint.provider == "custom"
        && url.scheme() == "https"
        && url.port_or_known_default() == Some(443)
        && url.username().is_empty()
        && url.password().is_none()
        && url.query().is_none()
        && url.fragment().is_none()
        && matches!(url.path().trim_end_matches('/'), "" | "/v1")
        && matches!(
            url.host_str(),
            Some("api.agnes-ai.cn" | "apihub.agnes-ai.cn" | "apihub.agnes-ai.com")
        )
}

/// Keep user-specified provider options; fill dimensions only when not configured.
fn configure_body(
    body: &mut Value,
    model: &ResolvedModel,
    ratio: &str,
    transparent: bool,
) -> Result<(), ImageError> {
    let (width, height) = dimensions(ratio)?;
    let body = body.as_object_mut().ok_or_else(|| {
        error(
            "image_request_invalid",
            "The image request is invalid.",
            false,
        )
    })?;
    if body.get("n").is_some_and(|n| n.as_u64() != Some(1))
        || body.get("stream").is_some_and(|stream| stream != false)
        || body
            .get("sequential_image_generation")
            .is_some_and(|mode| mode != "disabled")
    {
        return Err(error(
            "image_options_conflict",
            "Image Options must request one image and a non-streaming response.",
            false,
        ));
    }
    let provider = model.endpoint.provider.as_str();
    let name = model.endpoint.model.to_ascii_lowercase();
    let gpt_image = name.starts_with("gpt-image-") || name == "chatgpt-image-latest";
    if transparent && !supports_transparency(model) {
        return Err(error(
            "image_transparency_unsupported",
            "This image model has no verified transparent-background API. Choose a GPT Image model or request an opaque image.",
            false,
        ));
    }
    if transparent {
        body.insert("background".into(), json!("transparent"));
        if body
            .get("output_format")
            .is_none_or(|format| !matches!(format.as_str(), Some("png" | "webp")))
        {
            body.insert("output_format".into(), json!("png"));
        }
    }
    if is_agnes(model) {
        return configure_agnes(body, ratio);
    }
    let size = format!("{width}x{height}");
    match provider {
        "openai" => {
            // GPT Image 1.x supports only square/landscape/portrait presets.
            // Keep actual returned dimensions; never claim an exact requested ratio.
            let size = if name.starts_with("gpt-image-1") {
                if width == height {
                    "1024x1024".into()
                } else if width > height {
                    "1536x1024".into()
                } else {
                    "1024x1536".into()
                }
            } else {
                size
            };
            set_default(body, "size", json!(size));
            if gpt_image && body.contains_key("response_format") {
                return Err(error(
                    "image_options_conflict",
                    "GPT Image returns base64 automatically; remove response_format from Image Options.",
                    false,
                ));
            }
        }
        "gemini" => {
            set_default(body, "size", json!(size));
            set_default(body, "response_format", json!("b64_json"));
        }
        "together" => {
            if name.contains("schnell") || name.contains("kontext") {
                set_default(body, "aspect_ratio", json!(ratio));
            } else if !body.contains_key("aspect_ratio") {
                set_default(body, "width", json!(width));
                set_default(body, "height", json!(height));
            }
            set_default(body, "response_format", json!("base64"));
        }
        "xai" => {
            set_default(body, "aspect_ratio", json!(ratio));
            set_default(body, "response_format", json!("b64_json"));
        }
        "zai" => {
            let size = if name == "glm-image" {
                match ratio {
                    "1:1" => "1280x1280",
                    "4:3" => "1472x1088",
                    "3:4" => "1088x1472",
                    "4:5" => "1024x1280",
                    "16:9" => "1728x960",
                    _ => "960x1728",
                }
                .to_string()
            } else {
                size
            };
            set_default(body, "size", json!(size));
        }
        "volcengine" | "byteplus" => {
            // 2048-square-equivalent sizes also satisfy Seedream 4.5's minimum area.
            let size = match ratio {
                "1:1" => "2048x2048",
                "4:3" => "2304x1728",
                "3:4" => "1728x2304",
                "4:5" => "1792x2240",
                "16:9" => "2560x1440",
                _ => "1440x2560",
            };
            set_default(body, "size", json!(size));
            set_default(body, "response_format", json!("b64_json"));
            // Newer Pro/Flash models do not accept the sequential option at all.
            if name.contains("seedream-4") || name.contains("seedream-5-0-lite") {
                set_default(body, "sequential_image_generation", json!("disabled"));
            }
        }
        "custom" => {
            if !["width", "height", "aspect_ratio", "image_size", "size"]
                .iter()
                .any(|key| body.contains_key(*key))
            {
                set_default(body, "size", json!(size));
            }
        }
        _ => {
            return Err(error(
                "image_provider_unsupported",
                "The selected provider does not support the Images API.",
                false,
            ));
        }
    }
    Ok(())
}

fn configure_agnes(body: &mut Map<String, Value>, ratio: &str) -> Result<(), ImageError> {
    // The original Agnes adapter uses resolution tiers and requests inline bytes.
    // 4:5 is not a provider ratio; retain the actual returned dimensions downstream.
    let provider_ratio = if ratio == "4:5" { "3:4" } else { ratio };
    for key in [
        "response_format",
        "aspect_ratio",
        "resolution",
        "image",
        "input_references",
    ] {
        body.remove(key);
    }
    set_default(body, "size", json!("1K"));
    body.insert("ratio".into(), json!(provider_ratio));
    body.insert("return_base64".into(), json!(true));
    let extra = body.entry("extra_body").or_insert_with(|| json!({}));
    let extra = extra.as_object_mut().ok_or_else(|| {
        error(
            "image_options_conflict",
            "Agnes Image Options extra_body must be a JSON object.",
            false,
        )
    })?;
    extra.insert("response_format".into(), json!("b64_json"));
    Ok(())
}

fn set_default(body: &mut Map<String, Value>, key: &str, value: Value) {
    body.entry(key.to_string()).or_insert(value);
}

enum ImageSource {
    Inline(Vec<u8>),
    Remote(String),
}

fn parse_source(payload: &Value) -> Result<ImageSource, ImageError> {
    let items = payload
        .get("data")
        .and_then(Value::as_array)
        .filter(|items| items.len() == 1)
        .ok_or_else(|| {
            error(
                "image_response_invalid",
                "The image provider must return exactly one image.",
                true,
            )
        })?;
    if let Some(encoded) = items[0]
        .get("b64_json")
        .and_then(Value::as_str)
        .filter(|s| !s.is_empty())
    {
        if encoded.len() > MAX_IMAGE_BYTES.div_ceil(3) * 4 {
            return Err(error(
                "image_too_large",
                "The generated image exceeds the 20 MiB limit.",
                true,
            ));
        }
        let bytes = STANDARD.decode(encoded).map_err(|_| {
            error(
                "image_response_invalid",
                "The provider returned invalid base64 image data.",
                true,
            )
        })?;
        return Ok(ImageSource::Inline(bytes));
    }
    let url = items[0]
        .get("url")
        .and_then(Value::as_str)
        .filter(|s| !s.is_empty() && s.len() <= 16_384)
        .ok_or_else(|| {
            error(
                "image_response_invalid",
                "The provider returned no usable image.",
                true,
            )
        })?;
    Ok(ImageSource::Remote(url.to_string()))
}

async fn provider_error(mut response: Response) -> ImageError {
    let status = response.status().as_u16();
    let html = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .is_some_and(|value| value.to_ascii_lowercase().contains("text/html"));
    let challenge = response
        .headers()
        .get("cf-mitigated")
        .is_some_and(|value| value == "challenge");
    // Error documents are diagnostic input only. Never return their text, URLs,
    // request headers or request IDs: upstream messages may repeat credentials.
    let mut bytes = Vec::new();
    while let Ok(Some(chunk)) = response.chunk().await {
        if bytes.len() + chunk.len() > 65_536 {
            break;
        }
        bytes.extend_from_slice(&chunk);
    }
    let payload = serde_json::from_slice::<Value>(&bytes).ok();
    classify_provider_error(status, html || challenge, payload.as_ref())
}

fn classify_provider_error(status: u16, gateway: bool, payload: Option<&Value>) -> ImageError {
    let details = payload.map(|payload| payload.get("error").unwrap_or(payload));
    let strings: Vec<String> = details
        .into_iter()
        .flat_map(|error| {
            ["code", "type", "message"]
                .into_iter()
                .filter_map(move |field| error.get(field).and_then(Value::as_str))
        })
        .map(str::to_lowercase)
        .collect();
    let contains = |needles: &[&str]| {
        strings
            .iter()
            .any(|value| needles.iter().any(|needle| value.contains(needle)))
    };
    if contains(&[
        "content_policy",
        "content policy",
        "content_safety",
        "content safety",
        "safety_violation",
        "moderation_blocked",
        "内容审核",
        "内容安全",
    ]) {
        return error(
            "image_provider_content_policy",
            "The image provider rejected this request under its content policy. Review the image prompt.",
            false,
        );
    }
    if status == 402
        || contains(&[
            "insufficient_quota",
            "quota_exceeded",
            "insufficient_balance",
            "credit_exhausted",
            "billing_hard_limit",
            "余额不足",
            "额度不足",
        ])
    {
        return error(
            "image_provider_quota",
            "The image provider account has insufficient quota or credit. Check the provider account before retrying.",
            false,
        );
    }
    if status == 403 && gateway {
        return error(
            "image_provider_gateway",
            "The image endpoint or its network gateway denied access (HTTP 403). Check the endpoint and provider access policy.",
            false,
        );
    }
    match status {
        401 => error(
            "image_provider_auth",
            "The image provider rejected authentication (HTTP 401). Check the saved image API key, its provider region and account status.",
            false,
        ),
        403 if contains(&[
            "invalid_api_key",
            "incorrect_api_key",
            "invalid_token",
            "invalid api key",
            "invalid token",
            "无效的令牌",
            "不合法的令牌",
            "令牌无效",
        ]) =>
        {
            error(
                "image_provider_auth",
                "The image provider explicitly rejected the image API credential. Check the saved image API key and its provider region.",
                false,
            )
        }
        403 => error(
            "image_provider_forbidden",
            "The image provider denied this request (HTTP 403). Check model permissions, account or regional access rules; this does not necessarily mean the API key is invalid.",
            false,
        ),
        400 | 404 | 422 => error(
            "image_provider_rejected",
            "The image provider rejected the model, prompt or Options. Check Image model settings.",
            false,
        ),
        429 => error(
            "image_provider_rate_limit",
            "The image provider is rate limited. Retry after checking your quota.",
            false,
        ),
        300..=399 => error(
            "image_provider_redirect",
            "Image redirects are not followed. Configure the final provider endpoint.",
            false,
        ),
        _ => error(
            "image_provider_uncertain",
            "The image provider failed to return a completed result. Check the provider before retrying.",
            true,
        ),
    }
}

async fn bounded_body(mut response: Response, limit: usize) -> Result<Vec<u8>, ImageError> {
    if response
        .content_length()
        .is_some_and(|length| length > limit as u64)
    {
        return Err(error(
            "image_too_large",
            "The image response exceeds the supported limit.",
            true,
        ));
    }
    let mut bytes = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(|_| {
        error(
            "image_response_incomplete",
            "The image response was interrupted. Check the provider before retrying.",
            true,
        )
    })? {
        if chunk.len() > limit.saturating_sub(bytes.len()) {
            return Err(error(
                "image_too_large",
                "The image response exceeds the supported limit.",
                true,
            ));
        }
        bytes.extend_from_slice(&chunk);
    }
    Ok(bytes)
}

fn public_ip(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(ip) => {
            let [a, b, c, _] = ip.octets();
            !(a == 0
                || a == 10
                || a == 127
                || a >= 224
                || (a == 100 && (64..=127).contains(&b))
                || (a == 169 && b == 254)
                || (a == 172 && (16..=31).contains(&b))
                || (a == 192 && (b == 0 || b == 168 || (b == 88 && c == 99)))
                || (a == 198 && (b == 18 || b == 19 || (b == 51 && c == 100)))
                || (a == 203 && b == 0 && c == 113))
        }
        IpAddr::V6(ip) => {
            let segments = ip.segments();
            (segments[0] & 0xe000) == 0x2000
                && segments[0] != 0x2002
                && !(segments[0] == 0x2001 && (segments[1] < 0x0200 || segments[1] == 0x0db8))
        }
    }
}

fn download_url(raw: &str) -> Result<Url, ImageError> {
    let failure = || {
        error(
            "image_url_unsafe",
            "The provider returned an unsafe image URL. Use an inline base64 response if supported.",
            true,
        )
    };
    let url = Url::parse(raw).map_err(|_| failure())?;
    if url.scheme() != "https"
        || !url.username().is_empty()
        || url.password().is_some()
        || url.fragment().is_some()
        || url.port_or_known_default() != Some(443)
    {
        return Err(failure());
    }
    match url.host() {
        Some(url::Host::Ipv4(ip)) if public_ip(ip.into()) => {}
        Some(url::Host::Ipv6(ip)) if public_ip(ip.into()) => {}
        Some(url::Host::Domain(domain))
            if domain.contains('.')
                && !domain.ends_with('.')
                && ![".localhost", ".local", ".internal", ".test", ".invalid"]
                    .iter()
                    .any(|suffix| domain.ends_with(suffix)) => {}
        _ => return Err(failure()),
    }
    Ok(url)
}

async fn download(raw: &str, options: &ModelOptions) -> Result<Vec<u8>, ImageError> {
    let url = download_url(raw)?;
    let host = url
        .host_str()
        .ok_or_else(|| error("image_url_unsafe", "The image URL has no host.", true))?;
    let connect = Duration::from_secs(options.connect_timeout_seconds.unwrap_or(15));
    let addresses: Vec<SocketAddr> = match url.host() {
        Some(url::Host::Ipv4(ip)) => vec![SocketAddr::new(ip.into(), 443)],
        Some(url::Host::Ipv6(ip)) => vec![SocketAddr::new(ip.into(), 443)],
        _ => tokio::time::timeout(connect, tokio::net::lookup_host((host, 443)))
            .await
            .map_err(|_| {
                error(
                    "image_download_failed",
                    "The generated image host did not respond.",
                    true,
                )
            })?
            .map_err(|_| {
                error(
                    "image_download_failed",
                    "The generated image host could not be resolved.",
                    true,
                )
            })?
            .collect(),
    };
    if addresses.is_empty() || addresses.iter().any(|address| !public_ip(address.ip())) {
        return Err(error(
            "image_url_unsafe",
            "The image URL resolves to a non-public network address.",
            true,
        ));
    }
    // Pin the checked resolution; no proxy, redirects, cookies, or provider credentials.
    let client = Client::builder()
        .no_proxy()
        .redirect(reqwest::redirect::Policy::none())
        .connect_timeout(connect)
        .read_timeout(Duration::from_secs(
            options.read_timeout_seconds.unwrap_or(300),
        ))
        .timeout(Duration::from_secs(
            options.request_timeout_seconds.unwrap_or(900),
        ))
        .resolve_to_addrs(host, &addresses)
        .user_agent("Yrkie/0.1 image-fetch")
        .build()
        .map_err(|_| {
            error(
                "image_download_failed",
                "The image downloader could not be initialized.",
                true,
            )
        })?;
    let response = client.get(url).send().await.map_err(|_| {
        error(
            "image_download_failed",
            "The generated image could not be downloaded. No new image was requested.",
            true,
        )
    })?;
    if !response.status().is_success() {
        return Err(error(
            "image_download_failed",
            "The image download was rejected or redirected. No new image was requested.",
            true,
        ));
    }
    bounded_body(response, MAX_IMAGE_BYTES).await
}

fn validate_image(bytes: Vec<u8>, transparent: bool) -> Result<GeneratedImage, ImageError> {
    let invalid = || {
        error(
            "image_invalid",
            "The provider did not return a valid PNG, JPEG or WebP image.",
            true,
        )
    };
    if bytes.is_empty() || bytes.len() > MAX_IMAGE_BYTES {
        return Err(error(
            "image_too_large",
            "The generated image must be between 1 byte and 20 MiB.",
            true,
        ));
    }
    let format = image::guess_format(&bytes).map_err(|_| invalid())?;
    let mime = match format {
        ImageFormat::Png => "image/png",
        ImageFormat::Jpeg => "image/jpeg",
        ImageFormat::WebP => "image/webp",
        _ => return Err(invalid()),
    };
    let reader = ImageReader::with_format(Cursor::new(&bytes), format);
    let (width, height) = reader.into_dimensions().map_err(|_| invalid())?;
    if width == 0
        || height == 0
        || width > 16_384
        || height > 16_384
        || u64::from(width) * u64::from(height) > MAX_PIXELS
    {
        return Err(error(
            "image_dimensions_invalid",
            "The generated image exceeds the 16384 pixel edge or 40 megapixel limit.",
            true,
        ));
    }
    let mut reader = ImageReader::with_format(Cursor::new(&bytes), format);
    let mut limits = Limits::default();
    limits.max_image_width = Some(16_384);
    limits.max_image_height = Some(16_384);
    limits.max_alloc = Some(MAX_PIXELS * 8);
    reader.limits(limits);
    let decoded = reader.decode().map_err(|_| invalid())?;
    if transparent
        && (!decoded.color().has_alpha()
            || !decoded.to_rgba8().pixels().any(|pixel| pixel[3] < 255))
    {
        return Err(error(
            "image_transparency_missing",
            "The image provider returned an opaque image although transparency was requested.",
            true,
        ));
    }
    Ok(GeneratedImage {
        bytes,
        mime,
        width,
        height,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::EndpointView;
    use zeroize::Zeroizing;

    fn model(provider: &str, name: &str) -> ResolvedModel {
        ResolvedModel {
            endpoint: EndpointView {
                provider: provider.into(),
                model: name.into(),
                base_url: "http://localhost:9999/v1".into(),
                has_api_key: false,
                options: ModelOptions::default(),
            },
            api_key: Zeroizing::new(String::new()),
        }
    }

    #[test]
    fn provider_options_preserve_user_values_and_require_real_capabilities() {
        let mut body = json!({"n":1,"size":"2048x2048","quality":"high"});
        configure_body(&mut body, &model("openai", "gpt-image-2"), "16:9", true).unwrap();
        assert_eq!(body["size"], "2048x2048");
        assert_eq!(body["background"], "transparent");
        assert_eq!(body["output_format"], "png");
        assert!(
            configure_body(
                &mut json!({}),
                &model("gemini", "gemini-image"),
                "16:9",
                true
            )
            .is_err()
        );
        assert!(
            configure_body(&mut json!({"n":2}), &model("custom", "test"), "1:1", false).is_err()
        );
        let mut body = json!({});
        configure_body(
            &mut body,
            &model("together", "black-forest-labs/FLUX.1-kontext-pro"),
            "16:9",
            false,
        )
        .unwrap();
        assert_eq!(body["aspect_ratio"], "16:9");
        assert_eq!(body["response_format"], "base64");
        assert!(body.get("width").is_none());
        let mut body = json!({});
        configure_body(&mut body, &model("zai", "glm-image"), "16:9", false).unwrap();
        assert_eq!(body["size"], "1728x960");
        assert!(body.get("n").is_none());
    }

    #[test]
    fn agnes_custom_endpoint_uses_its_original_inline_image_contract() {
        for host in [
            "api.agnes-ai.cn",
            "apihub.agnes-ai.cn",
            "apihub.agnes-ai.com",
        ] {
            let mut configured = model("custom", "agnes-image-2.5-flash");
            configured.endpoint.base_url = format!("https://{host}/v1");
            let mut body = json!({"model":"agnes-image-2.5-flash","prompt":"A cup","n":1});
            configure_body(&mut body, &configured, "16:9", false).unwrap();
            assert_eq!(body["size"], "1K");
            assert_eq!(body["ratio"], "16:9");
            assert_eq!(body["return_base64"], true);
            assert_eq!(body["extra_body"]["response_format"], "b64_json");
            assert!(body.get("response_format").is_none());
            let mut body = json!({"size":"2K","response_format":"url","extra_body":{"response_format":"url","image":["https://example.com/reference.png"]}});
            configure_body(&mut body, &configured, "4:5", false).unwrap();
            assert_eq!(body["size"], "2K");
            assert_eq!(body["ratio"], "3:4");
            assert_eq!(body["extra_body"]["response_format"], "b64_json");
            assert_eq!(body["extra_body"]["image"].as_array().unwrap().len(), 1);
            assert!(
                configure_body(&mut json!({"extra_body":[]}), &configured, "1:1", false).is_err()
            );
        }
        let mut configured = model("custom", "agnes-image-2.5-flash");
        configured.endpoint.base_url = "https://api.agnes-ai.cn.evil.example/v1".into();
        assert!(!is_agnes(&configured));
        let mut body = json!({});
        configure_body(&mut body, &configured, "16:9", false).unwrap();
        assert_eq!(body["size"], "1536x864");
        assert!(body.get("return_base64").is_none());
    }

    #[test]
    fn provider_urls_cannot_target_local_or_special_networks() {
        for url in [
            "http://example.com/a",
            "https://127.0.0.1/a",
            "https://[::1]/a",
            "https://169.254.169.254/a",
            "https://10.1.2.3/a",
            "https://192.168.0.1/a",
            "https://[::ffff:127.0.0.1]/a",
            "https://user:secret@example.com/a",
            "https://example.com:8443/a",
            "https://example.local/a",
            "https://localhost/a",
        ] {
            assert!(download_url(url).is_err(), "{url}");
        }
        assert!(download_url("https://images.example.com/image.png?signature=opaque").is_ok());
        assert!(!public_ip("100.64.0.1".parse().unwrap()));
        assert!(!public_ip("2001:db8::1".parse().unwrap()));
        assert!(public_ip("2606:4700::1111".parse().unwrap()));
    }

    #[test]
    fn decode_requires_one_real_image_and_verifies_transparency() {
        let mut output = Cursor::new(Vec::new());
        image::DynamicImage::ImageRgba8(image::RgbaImage::from_pixel(
            2,
            2,
            image::Rgba([20, 40, 60, 0]),
        ))
        .write_to(&mut output, ImageFormat::Png)
        .unwrap();
        let bytes = output.into_inner();
        let response = json!({"data":[{"b64_json":STANDARD.encode(&bytes)}]});
        let ImageSource::Inline(decoded) = parse_source(&response).unwrap() else {
            panic!("expected inline");
        };
        let image = validate_image(decoded, true).unwrap();
        assert_eq!((image.width, image.height, image.mime), (2, 2, "image/png"));
        assert!(validate_image(b"not-an-image".to_vec(), false).is_err());
        assert!(parse_source(&json!({"data":[]})).is_err());
        assert!(parse_source(&json!({"data":[{},{}]})).is_err());
        assert!(parse_source(&json!({"data":[{"b64_json":"invalid"}]})).is_err());
        let mut output = Cursor::new(Vec::new());
        image::DynamicImage::ImageRgb8(image::RgbImage::new(2, 2))
            .write_to(&mut output, ImageFormat::Png)
            .unwrap();
        assert!(validate_image(output.into_inner(), true).is_err());
    }

    #[tokio::test]
    async fn real_transport_accepts_inline_bytes_but_rejects_private_response_urls() {
        use axum::{Json, Router, routing::post};
        let mut output = Cursor::new(Vec::new());
        image::DynamicImage::ImageRgb8(image::RgbImage::new(2, 2))
            .write_to(&mut output, ImageFormat::Png)
            .unwrap();
        let encoded = STANDARD.encode(output.into_inner());
        let app = Router::new().route(
            "/v1/images/generations",
            post(move |Json(input): Json<Value>| {
                let encoded = encoded.clone();
                async move {
                    assert_eq!(input["n"], 1);
                    assert_eq!(input["size"], "1536x864");
                    if input["prompt"] == "private-url" {
                        Json(json!({"data":[{"url":"https://127.0.0.1/private"}]}))
                    } else {
                        Json(json!({"data":[{"b64_json":encoded}]}))
                    }
                }
            }),
        );
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap();
        let server = tokio::spawn(async move {
            axum::serve(listener, app).await.unwrap();
        });
        let mut model = model("custom", "fixture");
        model.endpoint.base_url = format!("http://{address}/v1");
        let (_sender, cancel) = watch::channel(false);
        let image = generate(&model, "inline", "16:9", false, cancel.clone())
            .await
            .unwrap();
        assert_eq!((image.width, image.height), (2, 2));
        let failure = generate(&model, "private-url", "16:9", false, cancel)
            .await
            .err()
            .unwrap();
        assert_eq!(failure.code, "image_url_unsafe");
        assert!(failure.uncertain);
        let (_sender, cancel) = watch::channel(true);
        assert_eq!(
            generate(&model, "cancel", "16:9", false, cancel)
                .await
                .err()
                .unwrap()
                .code,
            "cancelled"
        );
        server.abort();
    }

    #[tokio::test]
    async fn provider_failures_distinguish_access_policy_gateway_and_quota_without_echoing_secrets()
    {
        use axum::{
            Json, Router,
            http::{HeaderMap, StatusCode},
            response::IntoResponse,
            routing::post,
        };
        use std::sync::{
            Arc,
            atomic::{AtomicUsize, Ordering},
        };
        let requests = Arc::new(AtomicUsize::new(0));
        let count = requests.clone();
        let app = Router::new().route("/v1/images/generations", post(move |headers: HeaderMap, Json(input): Json<Value>| {
            count.fetch_add(1, Ordering::SeqCst);
            async move {
                assert_eq!(headers.get("authorization").unwrap(), "Bearer local-fixture-secret");
                let prompt = input["prompt"].as_str().unwrap();
                if prompt == "gateway" {
                    return (StatusCode::FORBIDDEN, [("content-type", "text/html")], "<html>gateway local-fixture-secret</html>").into_response();
                }
                let (status, code) = match prompt {
                    "auth" => (StatusCode::UNAUTHORIZED, "invalid_api_key"),
                    "explicit-auth" => (StatusCode::FORBIDDEN, "invalid_token"),
                    "policy" => (StatusCode::FORBIDDEN, "content_policy_violation"),
                    "quota" => (StatusCode::TOO_MANY_REQUESTS, "insufficient_quota"),
                    _ => (StatusCode::FORBIDDEN, "permission_denied"),
                };
                (status, Json(json!({"error":{"code":code,"message":"Rejected local-fixture-secret https://private.example/?token=secret"}}))).into_response()
            }
        }));
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap();
        let server = tokio::spawn(async move {
            axum::serve(listener, app).await.unwrap();
        });
        let mut configured = model("custom", "fixture");
        configured.endpoint.base_url = format!("http://{address}/v1");
        configured.api_key = Zeroizing::new("local-fixture-secret".into());
        let (_sender, cancel) = watch::channel(false);
        for (prompt, expected) in [
            ("auth", "image_provider_auth"),
            ("explicit-auth", "image_provider_auth"),
            ("policy", "image_provider_content_policy"),
            ("quota", "image_provider_quota"),
            ("gateway", "image_provider_gateway"),
            ("forbidden", "image_provider_forbidden"),
        ] {
            let failure = generate(&configured, prompt, "16:9", false, cancel.clone())
                .await
                .err()
                .unwrap();
            assert_eq!(failure.code, expected);
            assert!(!failure.uncertain);
            assert!(!failure.message.contains("local-fixture-secret"));
            assert!(!failure.message.contains("private.example"));
        }
        assert_eq!(
            requests.load(Ordering::SeqCst),
            6,
            "No automatic retries of image generation"
        );
        server.abort();
    }
}
