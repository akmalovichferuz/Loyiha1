const { Telegraf, Markup } = require('telegraf');
const User = require('../models/User');
const Note = require('../models/Note');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Vaqtincha raqamlarni saqlash uchun obyekt (authController ga ham kerak bo'ladi)
const tempUsers = {}; 

// 1. START buyrug'i (Aqlli tekshiruv bilan)
bot.start(async (ctx) => {
  const chatId = ctx.chat.id;
  const firstName = ctx.from.first_name || "Hurmatli foydalanuvchi";

  try {
    // 🌟 YANGILIK: Avval bu odam bazada bor-yo'qligini tekshiramiz
    const existingUser = await User.findOne({ telegramChatId: chatId });

    if (existingUser) {
      // Tizimda bor foydalanuvchi uchun javob:
      return ctx.reply(
        `Assalomu alaykum yana bir bor, *${firstName}*! 👋\n\nSiz tizimimizdan allaqachon muvaffaqiyatli ro'yxatdan o'tgansiz va profilingiz botga ulangan.\n\n🌐 Iltimos, barcha amallarni (yangi zametkalar yozish, tadbirlarga chipta olish) sayt orqali bajaring. Bot orqali esa faqat muhim bildirishnomalar va eslatmalarni qabul qilib olasiz!`,
        {
          parse_mode: 'Markdown',
          reply_markup: { remove_keyboard: true } // Pastdagi kontakt tugmasini olib tashlaydi
        }
      );
    }

    // Tizimda yo'q (yangi) foydalanuvchi uchun javob:
    ctx.reply(
      `Assalomu alaykum, *${firstName}*!\nLoyihalar tizimining (Zametkalar va Tadbirlar) rasmiy botiga xush kelibsiz.\n\nBu bot orqali siz o'z zametkalaringiz bo'yicha muhim eslatmalarni va tadbirlar uchun elektron chiptalarni qabul qilib olasiz.\n\n⚠️ *Tizimdan to'liq foydalanish uchun:*
1. Pastdagi tugma orqali o'z profilingizni (telefon raqamingizni) botga ulang.
2. Saytga kirib, shu raqam orqali ro'yxatdan o'ting.\n\n_Iltimos, avval pastdagi tugmani bosing:_ 👇`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [{ text: "📞 Kontaktni ulashish", request_contact: true }]
          ],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      }
    );
  } catch (error) {
    console.error("Start buyrug'ida xatolik:", error);
    ctx.reply("❌ Kechirasiz, tizimda xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
  }
});

// 2. Kontakt yuborilganda (Yagona chiroyli xabar bilan)
bot.on('contact', async (ctx) => {
  const phone = ctx.message.contact.phone_number;
  const chatId = ctx.chat.id;
  const cleanPhone = '+' + phone.replace(/[^0-9]/g, '');

  tempUsers[cleanPhone] = chatId;

  let user = await User.findOne({ phoneNumber: cleanPhone });
  if (!user) {
    user = new User({
      phoneNumber: cleanPhone,
      telegramChatId: chatId,
      firstName: ctx.message.from.first_name || "Foydalanuvchi",
      lastName: ctx.message.from.last_name || ""
    });
    await user.save();
  }

  // 1-QADAM: Eski tugmani yig'ishtirish uchun "ayyorona" usul
  // Kichkina xabar jo'natib klaviaturani tozalaymiz va darhol xabarni o'chirib tashlaymiz
  const tempMsg = await ctx.reply("⏳", { reply_markup: { remove_keyboard: true } });
  await ctx.deleteMessage(tempMsg.message_id);

  // 2-QADAM: Siz xohlagan yagona, chiroyli xabar va unga yopishtirilgan KENG tugma
  const webAppUrl = process.env.WEBAPP_URL;
  
  await ctx.reply(
    `✅ *Raqamingiz muvaffaqiyatli saqlandi!*\n\nEndi tizimga kirish uchun pastdagi tugmani bosing.`,
    { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          // Tugma butun xabar kengligida chiqishi uchun bitta qatorga bitta tugma qo'yamiz
          [{ text: "🌐 Bizning veb-sayt", web_app: { url: webAppUrl } }]
        ]
      }
    }
  );
});

// 3. "Bajardim" tugmasi bosilganda ishlaydigan mantiq
bot.action(/^done_(.+)$/, async (ctx) => {
  try {
    const noteId = ctx.match[1]; // Tugmadagi ID ni ajratib olamiz
    
    // Bazadan zametkani topib, yangilaymiz
    const note = await Note.findById(noteId);
    
    if (!note) {
      return ctx.answerCbQuery("❌ Bu vazifa bazadan topilmadi (O'chirilgan bo'lishi mumkin).", { show_alert: true });
    }

    if (note.isCompleted) {
      return ctx.answerCbQuery("ℹ️ Bu vazifa allaqachon bajarilgan!", { show_alert: true });
    }

    // Vazifani bajarilgan deb belgilaymiz
    note.isCompleted = true;
    await note.save();

    // Kreativ tasdiqlash xabari
    await ctx.editMessageText(
      `🏆 *Ajoyib natija!* 🏔\n\nSiz ~${note.title}~ vazifasini muvaffaqiyatli yakunladingiz.\n\n_🌐 Saytdagi "Bajarilganlar" ro'yxati yangilandi. Faqat olg'a!_ 🚀`,
      { parse_mode: 'Markdown' }
    );

  } catch (error) {
    console.error(error);
    ctx.answerCbQuery("❌ Xatolik yuz berdi.", { show_alert: true });
  }
});
// ... oldingi bot.on, bot.action kodlari ...

// YANGILIK: Bot ishga tushganda doimiy Menu tugmasini .env dagi URL ga qarab yangilash
bot.telegram.setChatMenuButton({
  menu_button: {
    type: 'web_app',
    text: 'Saytga kirish', // Tugmada nima yozuv chiqishi (xohlasangiz 'Open' yoki 'Kabinet' qiling)
    web_app: { url: process.env.WEBAPP_URL }
  }
}).then(() => {
  console.log(`✅ Menu tugmasi muvaffaqiyatli o'rnatildi: ${process.env.WEBAPP_URL}`);
}).catch(err => {
  console.error("❌ Menu tugmasini o'rnatishda xatolik (URL https bilan boshlanganiga ishonch hosil qiling):", err.message);
});

// Modulni eksport qilish (bu doim eng oxirida turishi kerak)
module.exports = { bot, tempUsers };
// Modulni eksport qilish va tempUsers ni ham ulashish (authController uchun)
module.exports = { bot, tempUsers };