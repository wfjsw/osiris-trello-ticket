function renderIntro() {
    return `欢迎使用 TGCN-通用工单系统
    
    本工单系统将负责收集用户要求并追踪实现进度。
    
    /create - 提交新工单
    /list - 获取全部活动的工单
    /cancel - 恢复初始状态
`
}

function writeHelp(msg, result, bot) {
    if (msg.chat.id > 0){
        bot.sendMessage(msg.chat.id, renderIntro(), {
            reply_to_message_id: msg.message_id,
        })
    }
}

module.exports = exports = {
    run: [
        [/^\/start$/, writeHelp],
        [/^\/help/, writeHelp],
    ]
}
