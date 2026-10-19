// 作用：本地文件存储模块
// 关联：被 storage/lib.rs 调用

pub mod encrypt;
pub mod reader;
pub mod writer;

pub use reader::{clear_storage_root, get_storage_path, set_storage_root};
