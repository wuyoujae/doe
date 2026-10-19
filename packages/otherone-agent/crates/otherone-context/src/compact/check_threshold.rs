// 作用：检查当前 token 使用量是否超过阈值，判断是否需要触发压缩
// 关联：被 combine_context 调用
// 预期结果：返回 bool 值，true 表示需要压缩，false 表示不需要压缩

/// 检查 token 阈值
/// 作用：判断当前 token 使用量是否达到或超过上下文的阈值百分比
/// 关联：被 combine_context 调用，决定是否触发压缩
/// 预期结果：context_tokens >= context_window * threshold_percentage 时返回 true
pub fn check_threshold(
    context_tokens: u32,
    context_window: u32,
    threshold_percentage: Option<f32>,
) -> bool {
    let threshold_pct = threshold_percentage.unwrap_or(0.8);
    let threshold = (context_window as f32 * threshold_pct) as u32;
    context_tokens >= threshold
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_check_threshold_below() {
        // 50 tokens, 1000 window, 80% threshold -> 50 < 800, no compression
        assert!(!check_threshold(50, 1000, None));
    }

    #[test]
    fn test_check_threshold_above() {
        // 900 tokens, 1000 window, 80% threshold -> 900 >= 800, need compression
        assert!(check_threshold(900, 1000, None));
    }

    #[test]
    fn test_check_threshold_at_boundary() {
        // 800 tokens, 1000 window, 80% threshold -> 800 >= 800, need compression
        assert!(check_threshold(800, 1000, None));
    }

    #[test]
    fn test_check_threshold_custom_percentage() {
        // 60 tokens, 100 window, 50% threshold -> 60 >= 50, need compression
        assert!(check_threshold(60, 100, Some(0.5)));
        // 40 tokens, 100 window, 50% threshold -> 40 < 50, no compression
        assert!(!check_threshold(40, 100, Some(0.5)));
    }
}
