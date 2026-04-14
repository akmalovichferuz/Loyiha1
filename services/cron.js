const cron = require('node-cron');

// DIQQAT: Barcha yo'llar '../' (orqaga qaytish) orqali chaqirilmoqda
const Note = require('../models/Note'); 
const User = require('../models/User');
const {bot} = require('../bot/bot');

// Har 1 daqiqada ishga tushadigan funksiya
cron.schedule('* * * * *', async () => {
  const now = new Date();
  console.log("--- [CRON] Tekshiruv boshlandi ---");
  console.log("Hozirgi vaqt (UTC):", now.toISOString());

  try {
    const dueNotes = await Note.find({
      remindAt: { $lte: now },
      isReminded: false,
      isCompleted: false,
      isTrashed: false 
    }).populate('userId'); 

    console.log(`Topilgan eslatmalar soni: ${dueNotes.length}`);

    for (let note of dueNotes) {
      if (note.userId && note.userId.telegramChatId) {
        console.log(`Xabar yuborilmoqda: ${note.userId.telegramChatId} ga`);
        
        await bot.telegram.sendMessage(
            note.userId.telegramChatId,
            `⏰ *Vaqt keldi!* \n\n📌 *Mavzu:* ${note.title}`,
            { parse_mode: 'Markdown' }
        );

        note.isReminded = true;
        await note.save();
        console.log(`✅ Xabar yuborildi va status yangilandi: ${note.title}`);
      } else {
        console.log(`⚠️ Xato: Note (${note._id}) uchun userId yoki chatId topilmadi!`);
      }
    }
  } catch (error) {
    console.error("❌ Cron Job xatosi:", error.message);
  }
});

console.log("⏱ Cron Job (Eslatma taymeri) muvaffaqiyatli ishga tushdi!");