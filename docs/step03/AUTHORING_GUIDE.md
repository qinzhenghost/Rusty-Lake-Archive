# 内容录入规范

1. **优先写原创摘要，不抄游戏文本。** 不把完整对白、谜题解法、攻略步骤录入 StoryBlock。
2. **每个事实必须有来源。** 游戏内直接可见事实使用 `primary-game`；官网/press kit 使用官方 source；产品自己做的说明使用 `editorial`。
3. **推测不能写成事实。** 编辑解读标 `interpretation`，玩家理论标 `theory`。
4. **剧透按条目控制，而不是按整个人物控制。** 同一人物可有公开基础简介，也可有跨游戏锁定条目。
5. **双语实体必须保持语义一致。** QA 会检查中英文 rich text 中的 entity ID 集合。
6. **不确定时间不要伪造年份。** 使用 `certainty: uncertain`；章节若没有独立时间点可 `timeline: null`。
7. **图片默认 placeholder/original。** 只有获得明确授权后才使用 `official-licensed`。
8. **ID 永久稳定。** 显示名称可以改，实体 ID 不随翻译或标题调整而变化。