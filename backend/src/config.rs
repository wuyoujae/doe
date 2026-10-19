use std::{env, net::SocketAddr, path::PathBuf};
use url::Url;

pub struct Config {
    pub listen: SocketAddr,
    pub data_dir: PathBuf,
    pub allowed_origins: Vec<String>,
    pub allowed_hosts: Vec<String>,
}

impl Config {
    pub fn from_env() -> Result<Self, String> {
        let listen: SocketAddr = env::var("YRKIE_BACKEND_LISTEN")
            .unwrap_or_else(|_| "127.0.0.1:7763".into())
            .parse()
            .map_err(|_| "YRKIE_BACKEND_LISTEN must be an IPv4 loopback address")?;
        if !listen.ip().is_loopback() || !listen.is_ipv4() || listen.port() == 0 {
            return Err(
                "The local backend only supports an IPv4 loopback listener with a nonzero port"
                    .into(),
            );
        }
        let data_dir = env::var_os("YRKIE_DATA_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|| PathBuf::from(".run-data/backend"));
        let data_dir = if data_dir.is_absolute() {
            data_dir
        } else {
            env::current_dir()
                .map_err(|_| "Could not resolve the current working directory")?
                .join(data_dir)
        };
        let origins = env::var("YRKIE_FRONTEND_ORIGINS")
            .unwrap_or_else(|_| "http://127.0.0.1:7762,http://localhost:7762,http://127.0.0.1:7764,http://localhost:7764".into());
        let mut allowed_origins = Vec::new();
        let mut allowed_hosts = vec![listen.to_string(), format!("localhost:{}", listen.port())];
        for value in origins.split(',') {
            let value = value.trim();
            let url = Url::parse(value).map_err(|_| "Invalid YRKIE_FRONTEND_ORIGINS")?;
            if !matches!(url.scheme(), "http" | "https")
                || !matches!(url.host_str(), Some("127.0.0.1" | "localhost"))
                || !url.username().is_empty()
                || url.password().is_some()
                || url.query().is_some()
                || url.fragment().is_some()
                || url.path() != "/"
            {
                return Err("Frontend origins must be exact HTTP(S) loopback origins".into());
            }
            let origin = url.origin().ascii_serialization();
            let authority = origin
                .split_once("://")
                .ok_or("Invalid origin")?
                .1
                .to_owned();
            allowed_hosts.push(authority);
            allowed_origins.push(origin);
        }
        if allowed_origins.is_empty() {
            return Err("At least one frontend origin is required".into());
        }
        allowed_hosts.sort();
        allowed_hosts.dedup();
        Ok(Self {
            listen,
            data_dir,
            allowed_origins,
            allowed_hosts,
        })
    }
}
