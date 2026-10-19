// 作用：本地文件存储加密模块
// 关联：被 locafile writer 和 reader 调用，提供透明加解密
// 预期结果：使用 AES-256-GCM 加密存储文件内容，密钥由用户提供

use aes_gcm::aead::{Aead, KeyInit, OsRng};
use aes_gcm::{Aes256Gcm, Nonce};
use base64::Engine;
use rand::RngCore;

use crate::error::StorageError;

/// 加密管理器
/// 作用：管理 AES-256-GCM 加密密钥，提供加密和解密方法
/// 关联：在 localfile reader/writer 中作为可选包装层使用
/// 预期结果：对敏感数据进行透明加密存储
pub struct Encryptor {
    cipher: Aes256Gcm,
}

impl Encryptor {
    /// 使用 Base64 编码的密钥创建加密器
    /// 作用：从用户提供的 base64 密钥初始化 AES-256-GCM
    /// 关联：用户在初始化 Agent 时设置加密密钥
    /// 预期结果：密钥长度必须为 32 字节（256 位）
    pub fn from_base64_key(key_base64: &str) -> Result<Self, StorageError> {
        let key_bytes = base64::engine::general_purpose::STANDARD
            .decode(key_base64)
            .map_err(|e| StorageError::ConfigError(format!("Invalid base64 key: {}", e)))?;

        if key_bytes.len() != 32 {
            return Err(StorageError::ConfigError(format!(
                "Key must be 32 bytes (256 bits), got {} bytes",
                key_bytes.len()
            )));
        }

        let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes);
        let cipher = Aes256Gcm::new(key);

        Ok(Encryptor { cipher })
    }

    /// 生成新的随机密钥（Base64 编码）
    /// 作用：生成一个新的 256 位 AES 密钥，以 base64 返回
    /// 关联：用户首次设置加密时调用
    /// 预期结果：返回 base64 编码的 32 字节随机密钥
    pub fn generate_key() -> String {
        let mut key_bytes = [0u8; 32];
        OsRng.fill_bytes(&mut key_bytes);
        base64::engine::general_purpose::STANDARD.encode(&key_bytes)
    }

    /// 加密明文数据
    /// 作用：使用 AES-256-GCM 加密，返回 base64 编码的密文（含 nonce）
    /// 关联：被 localfile writer 调用，在写入文件前加密
    /// 预期结果：返回格式为 "base64_nonce.base64_ciphertext" 的密文
    pub fn encrypt(&self, plaintext: &str) -> Result<String, StorageError> {
        let mut nonce_bytes = [0u8; 12];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        let ciphertext = self
            .cipher
            .encrypt(nonce, plaintext.as_bytes())
            .map_err(|e| StorageError::ConfigError(format!("Encryption failed: {}", e)))?;

        let nonce_b64 = base64::engine::general_purpose::STANDARD.encode(&nonce_bytes);
        let ciphertext_b64 = base64::engine::general_purpose::STANDARD.encode(&ciphertext);

        Ok(format!("{}.{}", nonce_b64, ciphertext_b64))
    }

    /// 解密密文
    /// 作用：解密 AES-256-GCM 密文
    /// 关联：被 localfile reader 调用，读取文件后解密
    /// 预期结果：返回原始明文数据
    pub fn decrypt(&self, encrypted: &str) -> Result<String, StorageError> {
        let parts: Vec<&str> = encrypted.splitn(2, '.').collect();
        if parts.len() != 2 {
            return Err(StorageError::ConfigError(
                "Invalid encrypted format".to_string(),
            ));
        }

        let nonce_bytes = base64::engine::general_purpose::STANDARD
            .decode(parts[0])
            .map_err(|e| StorageError::ConfigError(format!("Invalid nonce: {}", e)))?;
        let ciphertext = base64::engine::general_purpose::STANDARD
            .decode(parts[1])
            .map_err(|e| StorageError::ConfigError(format!("Invalid ciphertext: {}", e)))?;

        let nonce = Nonce::from_slice(&nonce_bytes);
        let plaintext = self
            .cipher
            .decrypt(nonce, ciphertext.as_ref())
            .map_err(|e| StorageError::ConfigError(format!("Decryption failed: {}", e)))?;

        String::from_utf8(plaintext).map_err(|e| {
            StorageError::ConfigError(format!("Invalid UTF-8 after decryption: {}", e))
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_key() {
        let key = Encryptor::generate_key();
        // Base64 of 32 bytes should be 44 chars
        assert_eq!(key.len(), 44);
    }

    #[test]
    fn test_encrypt_decrypt() {
        let key = Encryptor::generate_key();
        let encryptor = Encryptor::from_base64_key(&key).unwrap();

        let plaintext = "Hello, 杰哥! This is secret data.";
        let encrypted = encryptor.encrypt(plaintext).unwrap();

        // Encrypted should be different from plaintext
        assert_ne!(encrypted, plaintext);

        let decrypted = encryptor.decrypt(&encrypted).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn test_encrypt_produces_different_output() {
        let key = Encryptor::generate_key();
        let encryptor = Encryptor::from_base64_key(&key).unwrap();

        let plaintext = "test";
        let enc1 = encryptor.encrypt(plaintext).unwrap();
        let enc2 = encryptor.encrypt(plaintext).unwrap();

        // Same plaintext should produce different ciphertext (random nonce)
        assert_ne!(enc1, enc2);
    }

    #[test]
    fn test_invalid_key_length() {
        let result = Encryptor::from_base64_key("dG9vLXNob3J0");
        assert!(result.is_err());
    }
}
