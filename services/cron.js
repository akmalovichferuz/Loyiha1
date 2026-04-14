const cron = require('node-cron');

// DIQQAT: Barcha yo'llar '../' (orqaga qaytish) orqali chaqirilmoqda
const Note = require('../models/Note'); 
const User = require('../models/User');
const {bot} = require('../bot/bot');

// Har 1 daqiqada ishga tushadigan funksiya
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    
  console.log("--- CRON ISHLADI ---");
  console.log("Serverning hozirgi vaqti:", now.toLocaleString());
    
    // Vaqti kelgan, hali eslatilmagan va bajarilmagan zametkalarni qidiramiz
    const dueNotes = await Note.find({
      remindAt: { $lte: now },
      isReminded: false,
      isCompleted: false,
      isTrashed: false 
    }).populate('userId'); 

    for (let note of dueNotes) {
      if (note.userId && note.userId.telegramChatId) {
        
        // Botga kreativ xabar va chiroyli tugma yuboramiz
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