var _e, _storage, _trello
const regTicketId = /\[\s#([0-9a-z]{24})\s\]/

function checkLock(uid) {
    return _storage.get(`${uid}:locked`) ? true : false
}

async function processReply(msg, bot) {
    const ticket_id = regTicketId.exec(msg.reply_to_message.text)[1]
    const comment = `[ USER-INPUT ]\n\n${msg.text}`
    const result = await _trello.postComment(ticket_id, comment)
    const message = `您已成功追加内容到工单[ #${ticket_id} ]。\n请耐心等待客服回复。在此期间，您可以回复此条消息来追加更多内容。`
    return await bot.sendMessage(msg.from.id, message, {
        reply_to_message_id: msg.message_id
    })
}

function replyProcessor(msg, type, bot) {
    if (msg.chat.id > 0 && !checkLock(msg.from.id))
        if (msg.reply_to_message && msg.reply_to_message.from.id == _e.me.id)
            if (regTicketId.test(msg.reply_to_message.text))
                processReply(msg, bot)
}

module.exports = exports = {
    init: e => {
        _e = e
        _storage = _e.libs['tk_storage']
        _trello = _e.libs['tk_trello']
    },
    run: [
        ['text', replyProcessor]
    ]
}
