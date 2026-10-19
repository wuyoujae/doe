use std::{
    collections::HashMap,
    env,
    sync::{Mutex, OnceLock},
    time::Duration,
};

use reqwest::{
    header::{HeaderMap, HeaderValue, ACCEPT_ENCODING},
    Client, ClientBuilder, Proxy, RequestBuilder, Response, Url,
};

use crate::error::AiError;

const REQUIRED_ENV: &str = "YRKIE_AI_SOCKS5_PROXY_REQUIRED";
const ENDPOINT_ENV: &str = "YRKIE_AI_SOCKS5_PROXY_ENDPOINT";
const USERNAME_ENV: &str = "YRKIE_AI_SOCKS5_PROXY_USERNAME";
const PASSWORD_ENV: &str = "YRKIE_AI_SOCKS5_PROXY_PASSWORD";
const MAX_ENDPOINT_BYTES: usize = 2_048;
const MAX_SOCKS_CREDENTIAL_BYTES: usize = 255;
pub const DEFAULT_CONNECT_TIMEOUT_SECONDS: u64 = 15;
pub const DEFAULT_READ_TIMEOUT_SECONDS: u64 = 300;
pub const DEFAULT_REQUEST_TIMEOUT_SECONDS: u64 = 900;
pub const MAX_EXTERNAL_AI_CONNECT_RETRIES: usize = 3;

const MIN_CONNECT_TIMEOUT_SECONDS: u64 = 1;
const MAX_CONNECT_TIMEOUT_SECONDS: u64 = 120;
const MIN_READ_TIMEOUT_SECONDS: u64 = 30;
const MAX_READ_TIMEOUT_SECONDS: u64 = 3_600;
const MIN_REQUEST_TIMEOUT_SECONDS: u64 = 60;
const MAX_REQUEST_TIMEOUT_SECONDS: u64 = 7_200;
const EXTERNAL_AI_CONNECT_RETRY_DELAYS: [Duration; MAX_EXTERNAL_AI_CONNECT_RETRIES] = [
    Duration::from_millis(250),
    Duration::from_millis(500),
    Duration::from_millis(1_000),
];

#[derive(Debug, Clone, Copy, Hash, PartialEq, Eq)]
pub struct RequestTimeouts {
    pub connect: Duration,
    pub read: Duration,
    pub request: Duration,
}

impl Default for RequestTimeouts {
    fn default() -> Self {
        Self {
            connect: Duration::from_secs(DEFAULT_CONNECT_TIMEOUT_SECONDS),
            read: Duration::from_secs(DEFAULT_READ_TIMEOUT_SECONDS),
            request: Duration::from_secs(DEFAULT_REQUEST_TIMEOUT_SECONDS),
        }
    }
}

impl RequestTimeouts {
    pub fn from_config(config: &serde_json::Value) -> Result<Self, AiError> {
        let connect = timeout_value(
            config,
            &["connectTimeoutSeconds", "connect_timeout_seconds"],
            DEFAULT_CONNECT_TIMEOUT_SECONDS,
            MIN_CONNECT_TIMEOUT_SECONDS,
            MAX_CONNECT_TIMEOUT_SECONDS,
            "connect timeout",
        )?;
        let read = timeout_value(
            config,
            &["readTimeoutSeconds", "read_timeout_seconds"],
            DEFAULT_READ_TIMEOUT_SECONDS,
            MIN_READ_TIMEOUT_SECONDS,
            MAX_READ_TIMEOUT_SECONDS,
            "read timeout",
        )?;
        let request = timeout_value(
            config,
            &["requestTimeoutSeconds", "request_timeout_seconds"],
            DEFAULT_REQUEST_TIMEOUT_SECONDS,
            MIN_REQUEST_TIMEOUT_SECONDS,
            MAX_REQUEST_TIMEOUT_SECONDS,
            "request timeout",
        )?;
        if connect > request || read > request {
            return Err(config_error(
                "AI connect and read timeouts cannot exceed the request timeout.",
            ));
        }

        Ok(Self {
            connect: Duration::from_secs(connect),
            read: Duration::from_secs(read),
            request: Duration::from_secs(request),
        })
    }

    pub fn apply(self, builder: ClientBuilder) -> ClientBuilder {
        builder
            .connect_timeout(self.connect)
            .read_timeout(self.read)
            .timeout(self.request)
    }
}

enum AiProxyConfig {
    Direct,
    Socks5 {
        endpoint: String,
        username: String,
        password: String,
    },
}

static EXTERNAL_AI_CLIENTS: OnceLock<Mutex<HashMap<RequestTimeouts, Client>>> = OnceLock::new();

pub fn validate_external_ai_proxy_from_env(force_required: bool) -> Result<(), AiError> {
    config_from_env(force_required).map(|_| ())
}

pub fn external_ai_client(timeouts: RequestTimeouts) -> Result<Client, AiError> {
    let clients = EXTERNAL_AI_CLIENTS.get_or_init(|| Mutex::new(HashMap::new()));
    let mut clients = clients
        .lock()
        .map_err(|_| AiError::Other("AI HTTP client pool is unavailable.".to_string()))?;
    if let Some(client) = clients.get(&timeouts) {
        return Ok(client.clone());
    }

    let client = timeouts
        .apply(external_ai_client_builder()?)
        .pool_idle_timeout(Duration::from_secs(90))
        .pool_max_idle_per_host(32)
        .tcp_keepalive(Duration::from_secs(60))
        .build()?;
    clients.insert(timeouts, client.clone());
    Ok(client)
}

pub fn external_ai_client_builder() -> Result<ClientBuilder, AiError> {
    let builder = Client::builder()
        .no_proxy()
        .default_headers(external_ai_default_headers());
    match config_from_env(false)? {
        AiProxyConfig::Direct => Ok(builder),
        AiProxyConfig::Socks5 {
            endpoint,
            username,
            password,
        } => {
            let proxy = Proxy::all(&endpoint)
                .map_err(|_| config_error("AI SOCKS5 proxy endpoint is invalid."))?
                .basic_auth(&username, &password);
            Ok(builder.proxy(proxy))
        }
    }
}

pub async fn send_external_ai_request(request: RequestBuilder) -> Result<Response, reqwest::Error> {
    let mut request = request;
    for retry_index in 0..=MAX_EXTERNAL_AI_CONNECT_RETRIES {
        let retry_request = request.try_clone();
        match request.send().await {
            Ok(response) => return Ok(response),
            Err(error)
                if error.is_connect()
                    && retry_index < MAX_EXTERNAL_AI_CONNECT_RETRIES
                    && retry_request.is_some() =>
            {
                tokio::time::sleep(EXTERNAL_AI_CONNECT_RETRY_DELAYS[retry_index]).await;
                request = retry_request.expect("retry request is present");
            }
            Err(error) => return Err(error),
        }
    }
    unreachable!("external AI retry loop always returns")
}

fn external_ai_default_headers() -> HeaderMap {
    let mut headers = HeaderMap::new();
    headers.insert(ACCEPT_ENCODING, HeaderValue::from_static("identity"));
    headers
}

pub fn direct_ai_client_builder() -> ClientBuilder {
    Client::builder().no_proxy()
}

fn timeout_value(
    config: &serde_json::Value,
    keys: &[&str],
    default: u64,
    min: u64,
    max: u64,
    label: &str,
) -> Result<u64, AiError> {
    let Some(value) = keys.iter().find_map(|key| config.get(*key)) else {
        return Ok(default);
    };
    let Some(value) = value.as_u64() else {
        return Err(config_error(&format!("AI {label} must be an integer.")));
    };
    if !(min..=max).contains(&value) {
        return Err(config_error(&format!(
            "AI {label} is outside the allowed range."
        )));
    }
    Ok(value)
}

fn config_from_env(force_required: bool) -> Result<AiProxyConfig, AiError> {
    config_from_values(
        env::var(REQUIRED_ENV).ok().as_deref(),
        env::var(ENDPOINT_ENV).ok().as_deref(),
        env::var(USERNAME_ENV).ok().as_deref(),
        env::var(PASSWORD_ENV).ok().as_deref(),
        force_required,
    )
}

fn config_from_values(
    required: Option<&str>,
    endpoint: Option<&str>,
    username: Option<&str>,
    password: Option<&str>,
    force_required: bool,
) -> Result<AiProxyConfig, AiError> {
    let explicitly_required = parse_required(required)?;
    if force_required && !explicitly_required {
        return Err(config_error(
            "YRKIE_AI_SOCKS5_PROXY_REQUIRED=true is required in production.",
        ));
    }
    let required = force_required || explicitly_required;
    let endpoint = present_value(endpoint);
    let username = present_value(username);
    let password = present_value(password);
    let configured = endpoint.is_some() || username.is_some() || password.is_some();

    if !configured {
        return if required {
            Err(config_error("AI SOCKS5 proxy configuration is required."))
        } else {
            Ok(AiProxyConfig::Direct)
        };
    }
    let (endpoint, username, password) = match (endpoint, username, password) {
        (Some(endpoint), Some(username), Some(password)) => (endpoint, username, password),
        _ => {
            return Err(config_error(
                "AI SOCKS5 proxy configuration must include endpoint, username, and password.",
            ))
        }
    };

    validate_endpoint(endpoint)?;
    validate_credential(username, "username")?;
    validate_credential(password, "password")?;

    Ok(AiProxyConfig::Socks5 {
        endpoint: endpoint.to_string(),
        username: username.to_string(),
        password: password.to_string(),
    })
}

fn parse_required(value: Option<&str>) -> Result<bool, AiError> {
    match value.map(str::trim).filter(|value| !value.is_empty()) {
        None | Some("false") => Ok(false),
        Some("true") => Ok(true),
        Some(_) => Err(config_error(
            "YRKIE_AI_SOCKS5_PROXY_REQUIRED must be true or false.",
        )),
    }
}

fn present_value(value: Option<&str>) -> Option<&str> {
    value.filter(|value| !value.is_empty())
}

fn validate_endpoint(value: &str) -> Result<(), AiError> {
    if value.len() > MAX_ENDPOINT_BYTES
        || value.trim() != value
        || value.chars().any(char::is_control)
    {
        return Err(config_error("AI SOCKS5 proxy endpoint is invalid."));
    }
    let url =
        Url::parse(value).map_err(|_| config_error("AI SOCKS5 proxy endpoint is invalid."))?;
    if url.scheme() != "socks5h"
        || url.host_str().is_none()
        || explicit_port(value).is_none()
        || !url.username().is_empty()
        || url.password().is_some()
        || !matches!(url.path(), "" | "/")
        || url.query().is_some()
        || url.fragment().is_some()
    {
        return Err(config_error(
            "AI SOCKS5 proxy endpoint must be a socks5h origin with an explicit port and no credentials, path, query, or fragment.",
        ));
    }
    Ok(())
}

fn explicit_port(value: &str) -> Option<u16> {
    let authority = value.strip_prefix("socks5h://")?;
    let port = if authority.starts_with('[') {
        authority.rsplit_once("]:")?.1
    } else {
        authority.rsplit_once(':')?.1
    };
    port.parse::<u16>().ok().filter(|port| *port > 0)
}

fn validate_credential(value: &str, label: &str) -> Result<(), AiError> {
    if value.as_bytes().len() > MAX_SOCKS_CREDENTIAL_BYTES || value.chars().any(char::is_control) {
        return Err(config_error(&format!(
            "AI SOCKS5 proxy {label} is invalid."
        )));
    }
    Ok(())
}

fn config_error(message: &str) -> AiError {
    AiError::ConfigError(message.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn permits_direct_ai_only_when_proxy_is_optional() {
        assert!(matches!(
            config_from_values(None, None, None, None, false).unwrap(),
            AiProxyConfig::Direct
        ));
        assert!(config_from_values(None, None, None, None, true).is_err());
    }

    #[test]
    fn accepts_complete_socks5h_configuration() {
        assert!(matches!(
            config_from_values(
                Some("true"),
                Some("socks5h://proxy.example.com:1080"),
                Some("proxy-user"),
                Some("proxy-password"),
                true,
            )
            .unwrap(),
            AiProxyConfig::Socks5 { .. }
        ));
    }

    #[test]
    fn rejects_incomplete_or_unsafe_proxy_configuration() {
        for endpoint in [
            "socks5://proxy.example.com:1080",
            "socks5h://user@proxy.example.com:1080",
            "socks5h://proxy.example.com:1080/path",
            "socks5h://proxy.example.com:1080?leak=true",
        ] {
            assert!(config_from_values(
                Some("true"),
                Some(endpoint),
                Some("proxy-user"),
                Some("proxy-password"),
                false,
            )
            .is_err());
        }
        assert!(config_from_values(
            Some("true"),
            Some("socks5h://proxy.example.com:1080"),
            Some("proxy-user"),
            None,
            false,
        )
        .is_err());
        assert!(config_from_values(
            Some("true"),
            Some("socks5h://proxy.example.com:1080"),
            Some("proxy\nuser"),
            Some("proxy-password"),
            false,
        )
        .is_err());
    }

    #[test]
    fn request_timeouts_are_configurable_but_remain_bounded() {
        let configured = RequestTimeouts::from_config(&serde_json::json!({
            "connectTimeoutSeconds": 12,
            "readTimeoutSeconds": 240,
            "requestTimeoutSeconds": 1200
        }))
        .unwrap();
        assert_eq!(configured.connect, Duration::from_secs(12));
        assert_eq!(configured.read, Duration::from_secs(240));
        assert_eq!(configured.request, Duration::from_secs(1200));

        for invalid in [
            serde_json::json!({"connectTimeoutSeconds": 0}),
            serde_json::json!({"readTimeoutSeconds": 29}),
            serde_json::json!({"requestTimeoutSeconds": 7201}),
            serde_json::json!({"readTimeoutSeconds": 301, "requestTimeoutSeconds": 300}),
            serde_json::json!({"connectTimeoutSeconds": 1.5}),
        ] {
            assert!(RequestTimeouts::from_config(&invalid).is_err());
        }
    }

    #[test]
    fn external_ai_transport_requests_identity_encoded_responses() {
        assert_eq!(
            external_ai_default_headers().get(ACCEPT_ENCODING),
            Some(&HeaderValue::from_static("identity"))
        );
    }

    #[test]
    fn external_ai_connect_retry_policy_is_bounded() {
        assert_eq!(MAX_EXTERNAL_AI_CONNECT_RETRIES, 3);
        assert_eq!(
            EXTERNAL_AI_CONNECT_RETRY_DELAYS,
            [
                Duration::from_millis(250),
                Duration::from_millis(500),
                Duration::from_millis(1_000),
            ]
        );
    }

    #[tokio::test]
    async fn external_ai_transport_retries_connection_establishment_failures() {
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let address = listener.local_addr().unwrap();
        drop(listener);
        let request = direct_ai_client_builder()
            .connect_timeout(Duration::from_millis(100))
            .build()
            .unwrap()
            .get(format!("http://{address}/"));
        let started_at = std::time::Instant::now();

        let error = send_external_ai_request(request).await.unwrap_err();

        assert!(error.is_connect());
        assert!(
            started_at.elapsed()
                >= EXTERNAL_AI_CONNECT_RETRY_DELAYS
                    .iter()
                    .copied()
                    .sum::<Duration>()
        );
    }
}
