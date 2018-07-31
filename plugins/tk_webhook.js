const express = require('express')
const app = express()
const bodyParser = require('body-parser').json({
    strict: false
})
const {
    webhook_port,
    notification
} = require('../config.tk.json')
var bot

app.head('/mainHook', (req, res) => {
    res.status(200).send('ok').end()
})
/* eslint-disable indent*/
app.post('/mainHook', bodyParser, (req, res) => {
    switch (req.body.action.type) {
        case 'createCard':
            createCardProcessor(req)
            break
        case 'commentCard':
            commentCardProcessor(req)
            break
        case 'updateCard':
            if (req.body.action.data.old.idList)
                deptMigrationProcessor(req)
            else if (req.body.action.data.old.closed !== undefined)
                ticketCloseProcessor(req)
            break
            // contains migrate, archive etc    
        case 'addLabelToCard':
            labelAddedProcessor(req)
            break
        case 'removeLabelFromCard':
            labelRemovedProcessor(req)
            break
    }
    res.status(200).send('ok').end()
})
/* eslint-enable indent*/

app.listen(webhook_port)
// HTTP Server Part

// Bot Operation Part
async function commentCardProcessor(req) {
    const comment = req.body.action.data.text
    const card = req.body.action.data.card
    const [user_id, username, language_code] = req.body.action.data.card.name.split('|')
    if (comment.match('[ USER-INPUT ]')) {
        let message = `新用户追加\n${card.name}\n${req.body.action.data.list.name}\n\n------------\n\n${comment}`
        return bot.sendMessage(notification, message)
    } else if (comment.match('[ USER-CLOSE ]')) {
        //let message = `用户关闭\n${card.name}\n${req.body.action.data.list.name}\n\n------------\n\n${comment}`
        //return bot.sendMessage(notification, message)
        return
    } else {
        const message = `您的工单 [ #${card.id} ] 有新的进展\n部门: ${req.body.action.data.list.name}\n\n${comment}\n\n您可以直接回复此条消息来作出回应。（如何回复：轻触或右键此条消息选择 Reply。成功回复后您将收到一条回执。）`
        return bot.sendMessage(user_id, message)
    }
}

async function deptMigrationProcessor(req) {
    const [user_id, username, language_code] = req.body.action.data.card.name.split('|')
    const target_dept = req.body.action.data.listAfter.name
    const message = `您的工单 [ #${req.body.action.data.card.id} ] 已被移送至 "${target_dept}" 部门。`
    return bot.sendMessage(user_id, message)
}

async function createCardProcessor(req) {
    let message = `新工单\n${req.body.action.data.card.name}\n${req.body.action.data.list.name}`
    return bot.sendMessage(notification, message)
}

async function ticketCloseProcessor(req) {
    const [user_id, username, language_code] = req.body.action.data.card.name.split('|')
    const card = req.body.action.data.card
    const closed = card.closed
    if (closed === true)
        var message = `您的工单 [ #${req.body.action.data.card.id} ] 已被关闭。`
    else {
        var message = `您的工单 [ #${req.body.action.data.card.id} ] 已被重新开启。`
    }
    return bot.sendMessage(user_id, message)
}

async function labelAddedProcessor(req) {
    const [user_id, username, language_code] = req.body.action.data.card.name.split('|')
    const card = req.body.action.data.card
    const label = req.body.action.data.label.name
    const message = `您的工单 [ #${card.id} ] 已被添加标签 ${label}。`
    return bot.sendMessage(user_id, message)
}

async function labelRemovedProcessor(req) {
    const [user_id, username, language_code] = req.body.action.data.card.name.split('|')
    const card = req.body.action.data.card
    const label = req.body.action.data.label.name
    const message = `您的工单 [ #${card.id} ] 已被移除标签 ${label}。`
    return bot.sendMessage(user_id, message)
}

module.exports = exports = {
    init: e => {
        bot = e.bot
    }
}
