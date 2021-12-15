const Discord = require('discord.js')
const {
    CaptchaGenerator
} = require('captcha-canvas')

const client = new Discord.Client()
const prefix = '.'
const colors = require('./colors.json')


client.on('ready', () => {
    console.log(`${client.user.tag} is online!`)
    client.user.setStatus('dnd')
    client.user.setActivity('clay of captchas', {
        type: 'WATCHING'
    })
})


client.on('message', async message => {

    function generateCaptcha() {
        var length = 4,
            charset = "ABCDEFGHJKLMNOPRSTUVWXYZabcdefghjklmnopqrstuvwxyz1234567890",
            retVal = "";
        for (var i = 0, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        return retVal;
    }

    const genCaptcha = generateCaptcha()

    const captcha = new CaptchaGenerator()
        .setDimension(150, 450)
        .setCaptcha({
            text: genCaptcha,
            size: 60,
            color: "deeppink"
        })
        .setDecoy({
            opacity: 1
        })
        .setTrace({
            color: "deeppink"
        })
    const buffer = captcha.generateSync()

    if ( /*(message.channel.id !== message.guild.channels.cache.find(c => c.name.includes("verify"))) && */ !message.content.startsWith(prefix)) return
    if (message.author.bot) return
    if (message.channel.type === "dm") return


    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    const newCaptcha = new Discord.MessageAttachment(buffer, 'clay.png')

    if ( /*message.channel.id === message.guild.channels.cache.find(c => c.name.includes('verify')) && */ command === "verify") {

        message.channel.send({
            files: [newCaptcha],
            embed: {
title: `${message.guild.name} 
Sunucusuna Hoşgeldin!`,
description: 
`Lütfen Aşağıdaki Yazan Kodu Kanala Yazarmısın.
 
Merhaba! Sunucuya girmeden önce bir captcha tamamlamanız gerekmektedir.

**NOT:** **Bu, Büyük/Küçük Harfe Duyarlıdır.**
                            
**Neden?**
Bu, sunucuyu karşı korumak içindir.
otomatik kullanıcı hesaplarını kullanarak hedefli saldırılar.
                
**Captcha'nız:**`,
                image: {
                    url: 'attachment://clay.png'
                },
                color: "RANDOM"
            }
        }).then(() => {
            const filter = m => message.author.id === m.author.id;

            message.channel.awaitMessages(filter, {
                    time: 1 * 60000,
                    max: 1,
                    errors: ['time']
                })
                .then(async messages => {
                    if (messages.first().content === genCaptcha) {
                        message.channel.bulkDelete(3)
                        let verificationEmbed = new Discord.MessageEmbed()
                            .setAuthor(message.author.username, message.author.avatarURL({
                                dynamic: true
                            }))
                            .setColor(colors.green)
                            .setDescription(`**Doğrulamanız Gerçekleşti Teşekkür Ederiz: \`${message.guild.name}\`!**`)
                            .setFooter(message.client.user.username, message.client.user.avatarURL())
                        const role = message.guild.roles.cache.find(role => role.name === "Member");
                        message.member.roles.add(role);
                        await message.channel.send(verificationEmbed).then(m => m.delete({
                            timeout: 3000
                        }))
                        console.log(`${message.author.tag} Doğrulandı!`)
                    }

                })
                .catch(async () => {
                    message.member.kick().catch(error => {
                        console.log(`Bir hata oldu ${message.author.tag}! \n ${error}`)
                    })
                    message.channel.bulkDelete(2)
                    message.channel.createInvite({
                        maxAge: 0,
                        maxUses: 1
                    }).then(async invite => {
                        let retryEmbed = new Discord.MessageEmbed()
                        .setAuthor(message.author.username, message.author.avatarURL())
                        .setThumbnail(message.guild.iconURL({
                            dynamic: true
                        }))
                        .setTitle("Doğrulamada Başarısız Oldunuz!")
                        .setColor(colors.red)
                        .setImage('https://lh3.googleusercontent.com/proxy/Qr5p_PRwsOBjdrceMmp_tS5cXZ-Sfsd0r8E4Bzy2QuWdVCMzq08XiwAUrquIhtM-P9fPgo7T03aIZYY4AmQF5uA4AHWHH8LUTJPfYc8t9O8VyzhD7Qs')
                        .setDescription(`Doğrulamada başarısız oldunuz \`${message.guild.name}\`! Tekrar denemek isterseniz, tekrar katılmak için lütfen [burayı](${invite}) tıklayın!`)
                        .setFooter(message.client.user.username, message.client.user.avatarURL())
                        await message.author.send(retryEmbed)

                    })
                    
                });
        });
    }

})



client.login('BURAYA_TOKENİNİZ')
