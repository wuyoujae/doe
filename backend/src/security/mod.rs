use aes_gcm::{
    Aes256Gcm, KeyInit, Nonce,
    aead::{Aead, AeadCore, OsRng, Payload, rand_core::RngCore},
};
use std::{
    fs::{self, OpenOptions},
    io::Write,
    path::Path,
};
use zeroize::Zeroizing;

pub struct SecretStore {
    key: Zeroizing<[u8; 32]>,
}

impl SecretStore {
    pub fn open(
        data_dir: &Path,
        database_exists: bool,
    ) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        fs::create_dir_all(data_dir)?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(data_dir, fs::Permissions::from_mode(0o700))?;
        }
        let path = data_dir.join("master.key");
        let bytes =
            match fs::read(&path) {
                Ok(bytes) => Zeroizing::new(bytes),
                Err(error) if error.kind() == std::io::ErrorKind::NotFound && !database_exists => {
                    let mut key = Zeroizing::new(vec![0; 32]);
                    OsRng.fill_bytes(&mut key);
                    let mut options = OpenOptions::new();
                    options.write(true).create_new(true);
                    #[cfg(unix)]
                    {
                        use std::os::unix::fs::OpenOptionsExt;
                        options.mode(0o600);
                    }
                    match options.open(&path) {
                        Ok(mut file) => {
                            file.write_all(&key)?;
                            file.sync_all()?;
                            key
                        }
                        Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => {
                            Zeroizing::new(fs::read(&path)?)
                        }
                        Err(error) => return Err(error.into()),
                    }
                }
                Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Err(
                    "Existing database has no master.key; restore the matching key before starting"
                        .into(),
                ),
                Err(error) => return Err(error.into()),
            };
        let key: [u8; 32] = bytes
            .as_slice()
            .try_into()
            .map_err(|_| "master.key must contain exactly 32 bytes")?;
        Ok(Self {
            key: Zeroizing::new(key),
        })
    }

    pub fn encrypt(&self, kind: &str, secret: &str) -> Result<Vec<u8>, &'static str> {
        let cipher = Aes256Gcm::new_from_slice(self.key.as_ref()).map_err(|_| "Invalid key")?;
        let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
        let payload = cipher
            .encrypt(
                &nonce,
                Payload {
                    msg: secret.as_bytes(),
                    aad: kind.as_bytes(),
                },
            )
            .map_err(|_| "Encryption failed")?;
        let mut envelope = vec![1];
        envelope.extend_from_slice(&nonce);
        envelope.extend(payload);
        Ok(envelope)
    }

    pub fn decrypt(&self, kind: &str, envelope: &[u8]) -> Result<Zeroizing<String>, &'static str> {
        if envelope.len() < 29 || envelope[0] != 1 {
            return Err("Invalid encrypted key envelope");
        }
        let cipher = Aes256Gcm::new_from_slice(self.key.as_ref()).map_err(|_| "Invalid key")?;
        let plain = cipher
            .decrypt(
                Nonce::from_slice(&envelope[1..13]),
                Payload {
                    msg: &envelope[13..],
                    aad: kind.as_bytes(),
                },
            )
            .map_err(
                |_| "Model key cannot be decrypted; restore the matching database and master.key",
            )?;
        String::from_utf8(plain)
            .map(Zeroizing::new)
            .map_err(|_| "Invalid decrypted key")
    }
}
