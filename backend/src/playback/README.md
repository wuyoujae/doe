# 正式播放宿主

正式页面、Surface、动画调度和客户端状态投影直接来自 `98cbdd5736535e14bab4593973b33fddd4a99c64`。`projection.rs` 保留原 Show/命令校验，额外将已保存 Logo 传给原 Surface；`reducer.rs` 对应原 `presentation_playback.lua` 的逐项状态转换。

SQLite 只保存随机角色链接、冻结 Deck revision/Show 和每页演讲备注。临时现场、画笔和擦除墓碑只存进程内；原子互斥区覆盖快照创建、命令和备注写入。有界广播在同一锁内先订阅再读取初始 sync；序列缺口/积压关闭连接，由原客户端重连获取权威状态。激光不写历史、不推进 seq。每场 24 小时失效，重启结束现场但保留备注与文稿。

本地应用不提供商业账户和公开分享。只有受既有 Host/Origin 边界保护的播放设置入口建立 HttpOnly、SameSite=Strict 的本机拥有者 Cookie；其令牌仅存 `.run-data`，不进 JSON。后续角色链接、命令、素材和备注均核对 Cookie；角色精确匹配。观众响应和素材投影排除备注，备注读取/保存仅限演讲者。备注保存同时核对 epoch 与每页 revision，旧版本相同内容重试不重复写。

播放前宿主必须 flush 并保存编辑器，再提交 sourceRevision。冻结快照不会被后续编辑替换；重新启动显式创建新 epoch。平台适配不会把临时批注写回原 Deck。
