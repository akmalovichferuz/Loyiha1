const cron = require('node-cron');
const Note = require('../models/Note'); 
const User = require('../models/User');
const {bot} = require('../bot/bot');
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const uzbTime = new Date(utcTime + (5 * 3600000)); // UTC+5


    const dueNotes = await Note.find({
      remindAt: { $lte: uzbTime }, 
      isReminded: false,
      isCompleted: false,
      isTrashed: false 
    }).populate('userId'); 

    for (let note of dueNotes) {
      if (note.userId && note.userId.telegramChatId) {
        

        await bot.telegram.sendMessage(
            note.userId.telegramChatId,
            `⏰ *Vaqt keldi, Qahramon!* 🦸‍♂️\n\nSiz rejalashtirgan muhim vazifa vaqti bo'ldi. O'z ustingizda ishlashda davom eting!\n\n📌 *Mavzu:* ${note.title}\n📝 *Tafsilot:* ${note.content || 'Shunchaki harakatni boshlang!'}\n\n_Vazifani qoyilmaqom qilib bajarganingizdan so'ng, pastdagi tugmani bosishni unutmang!_ `,
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: "✅ Muvaffaqiyatli bajardim!", callback_data: `done_${note._id}` }]
                ]
              }
            }
          );

        note.isReminded = true;
        await note.save();
      }
    }
  } catch (error) {
    console.error("Cron Job xatosi:", error);
  }
});

console.log("⏱ Cron Job (Eslatma taymeri) muvaffaqiyatli ishga tushdi!");