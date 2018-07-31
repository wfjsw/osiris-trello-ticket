var _e, _storage, _trello, cache_department
const {
    err_report
} = require('../config.tk.json')

function checkLock(uid) {
    return _storage.get(`${uid}:locked`) ? true : false
}

function setLock(uid, isLocked) {
    return _storage.set(`${uid}:locked`, isLocked)
}

function getState(uid) {
    return _storage.get(`${uid}:state`)
}

function setState(uid, state) {
    return _storage.set(`${uid}:state`, state)
}

/**
 * stageI
 * Select Department
 * @param {Message} msg 
 * @param {TelegramBot} bot 
 */
async function stageI(msg, bot) {
    try {
        setLock(msg.from.id, true)
        setState(msg.from.id, {
            state: 'selectDepartment'
        })
        const message = `您正在创建工单。\n\n请选择工单的相关部门：`
        const departments = await _trello.getDepartments()
        cache_department = departments
        let keyboard = []
        Object.values(departments).forEach(dept => {
            keyboard.push([{
                text: dept
            }])
        })
        return await bot.sendMessage(msg.from.id, message, {
            reply_to_message_id: msg.message_id,
            reply_markup: {
                keyboard,
                one_time_keyboard: true
            }
        })
    } catch (e) {
        return await bot.sendMessage(err_report, e)
    }
}

/**
 * stageII
 * Verify Department and Ask Description
 * @param {Message} msg 
 * @param {TelegramBot} bot 
 */
async function stageII(msg, bot) {
    const user_input = msg.text
    if (Object.values(cache_department).indexOf(user_input) > -1) {
        const selected_department = Object.keys(cache_department)[Object.values(cache_department).indexOf(user_input)]
        setState(msg.from.id, {
            state: 'fillDescription',
            selected_department
        })
        const message = '请完整并准确的描述您的问题，仅支持文字（图片请使用图床外链）：'
        return await bot.sendMessage(msg.from.id, message, {
            reply_to_message_id: msg.message_id,
            reply_markup: {
                remove_keyboard: true
            }
        })
    } else {
        // Selected Department is Invalid
        const message = '您所选择的部门无效，请重新选择。'
        return await bot.sendMessage(msg.from.id, message, {
            reply_to_message_id: msg.message_id
        })
    }
}

/**
 * stageIII
 * Collect Description and Create Ticket
 * @param {Message} msg 
 * @param {TelegramBot} bot 
 */
async function stageIII(msg, bot) {
    const description = msg.text
    const {
        selected_department
    } = getState(msg.from.id)
    const {
        id,
        name,
        url
    } = await _trello.createTicket(msg.from, selected_department, description)
    const message = `已创建工单。\n\n工单编号: [ #${id} ]\n责任部门: ${cache_department[selected_department]}\n工单描述：\n${description}\n\n现在您可以回复此条消息以追加更多信息。（如何回复：轻触或右键此条消息选择 Reply。成功回复后您将收到一条回执。）\n小窍门：点击工单编号可以检索与该工单相关的所有消息。`
    // Job is done. Let's purge state.
    setState(msg.from.id, false)
    setLock(msg.from.id, false)
    return await bot.sendMessage(msg.from.id, message, {
        reply_to_message_id: msg.message_id
    })
}

async function processCreate(msg, result, bot) {
    const state = getState(msg.from.id)
    if (msg.chat.id > 0)
        if (!state && !checkLock(msg.from.id))
            stageI(msg, bot)
}

async function stageSelector(msg, type, bot) {
    if (msg.text[0] == '/') return
    if (msg.chat.id > 0 && checkLock(msg.from.id)) {
        const state = getState(msg.from.id)
        if (state['state'] == 'selectDepartment')
            stageII(msg, bot)
        else if (state['state'] == 'fillDescription')
            stageIII(msg, bot)
    }
}

module.exports = exports = {
    init: e => {
        _e = e
        _storage = _e.libs['tk_storage']
        _trello = _e.libs['tk_trello']
    },
    run: [
        [/^\/create/, processCreate],
        ['text', stageSelector]
    ]
}
