const fs = require('fs');
const path = require('path');

// Language translations mapping
const translations = {
  'hi': {
    // Basic pronouns and verbs
    'I': 'मैं',
    'you': 'आप',
    'he': 'वह',
    'she': 'वह',
    'we': 'हम',
    'they': 'वे',
    'it': 'यह',
    'me': 'मुझे',
    'him': 'उसे',
    'her': 'उसे',
    'I am …': 'मैं … हूं',
    'I have …': 'मेरे पास … है',
    'I want …': 'मुझे … चाहिए',
    'I need …': 'मुझे … की जरूरत है',
    'You are …': 'आप … हैं',
    'He is …': 'वह … है',
    'She is …': 'वह … है',
    'We are …': 'हम … हैं',
    'They are …': 'वे … हैं',
    'It is …': 'यह … है',

    // Numbers (missing ones)
    'zero': 'शून्य',
    'twenty': 'बीस',
    'thirty': 'तीस',
    'forty': 'चालीस',
    'fifty': 'पचास',
    'sixty': 'साठ',
    'seventy': 'सत्तर',
    'eighty': 'अस्सी',
    'ninety': 'नब्बे',
    'hundred': 'सौ',
    'two hundred': 'दो सौ',
    'three hundred': 'तीन सौ',
    'fifteen': 'पंद्रह',
    'twenty-five': 'पच्चीस',
    'forty-two': 'बयालीस',
    'seventy-eight': 'अठहत्तर',
    'one hundred twenty': 'एक सौ बीस',
    'five hundred': 'पांच सौ',
    'eight hundred fifty': 'आठ सौ पचास',
    'thousand': 'हजार',

    // Time and basic phrases
    'now': 'अभी',
    'It is three o\'clock.': 'तीन बजे हैं।',
    'It is half past two.': 'साढ़े दो बजे हैं।',
    'What day is today?': 'आज कौन सा दिन है?',
    'See you tomorrow.': 'कल मिलेंगे।',
    'I am late.': 'मैं देर से हूं।',
    'It is time to go.': 'जाने का समय हो गया है।',
    'How long does it take?': 'इसमें कितना समय लगेगा?',

    // Food and drinks (missing ones)
    'apple': 'सेब',
    'juice': 'रस',
    'I would like water, please.': 'मुझे पानी चाहिए, कृपया।',
    'The food is delicious.': 'भोजन बहुत स्वादिष्ट है।',
    'I am allergic to …': 'मुझे … से एलर्जी है।',
    'No sugar, please.': 'चीनी नहीं, कृपया।',
    'Do you have vegetarian food?': 'क्या आपके पास शाकाहारी भोजन है?',
    'How much is it?': 'इसकी कीमत कितनी है?',
    'I am hungry.': 'मैं भूखा हूं।',
    'I am thirsty.': 'मुझे प्यास लगी है।',
    'What do you recommend?': 'आप क्या सलाह देंगे?',
    'The bill, please.': 'बिल, कृपया।',

    // Shopping and money (completely missing)
    'price': 'कीमत',
    'money': 'पैसा',
    'card': 'कार्ड',
    'cash': 'नकद',
    'store': 'दुकान',
    'sale': 'बिक्री',
    'discount': 'छूट',
    'receipt': 'रसीद',
    'change': 'बदलाव',
    'bill': 'बिल',
    'How much does this cost?': 'इसकी कीमत कितनी है?',
    'Do you accept credit cards?': 'क्या आप क्रेडिट कार्ड स्वीकार करते हैं?',
    'Is there a sale today?': 'क्या आज बिक्री है?',
    'Can I get a discount?': 'क्या मुझे छूट मिल सकती है?',
    'I would like to pay by cash.': 'मैं नकद भुगतान करना चाहता हूं।',
    'Where is the nearest store?': 'निकटतम दुकान कहाँ है?',
    'Can I have a receipt?': 'क्या मुझे रसीद मिल सकती है?',
    'The price is too high.': 'कीमत बहुत ज्यादा है।',
    'I need change for a bill.': 'मुझे बिल के लिए बदलाव चाहिए।',
    'This store has good prices.': 'इस दुकान में अच्छी कीमतें हैं।',

    // Restaurant vocabulary (missing ones)
    'menu': 'मेनू',
    'waiter': 'वेटर',
    'order': 'ऑर्डर',
    'reservation': 'आरक्षण',
    'service': 'सेवा',
    'tip': 'टिप',
    'A table for two, please.': 'दो लोगों के लिए एक मेज, कृपया।',
    'Could we have the menu?': 'क्या हमें मेनू मिल सकता है?',
    'Do you have vegetarian options?': 'क्या आपके पास शाकाहारी विकल्प हैं?',
    'I would like to order.': 'मैं ऑर्डर करना चाहता हूं।',
    'How long will it take?': 'इसमें कितना समय लगेगा?',
    'Can we have some water?': 'क्या हमें कुछ पानी मिल सकता है?',
    'Do you accept credit cards?': 'क्या आप क्रेडिट कार्ड स्वीकार करते हैं?',

    // Getting around (missing ones)
    'Where is the station?': 'स्टेशन कहाँ है?',
    'How do I get to …?': 'मैं … तक कैसे पहुंचूं?',
    'Is it close?': 'क्या यह पास है?',
    'I am lost.': 'मैं खो गया हूं।',
    'Turn left.': 'बाएं मुड़ें।',
    'Go straight.': 'सीधे जाएं।',
    'It is over there.': 'यह वहां है।',
    'Can you help me?': 'क्या आप मेरी मदद कर सकते हैं?',
    'How far is it?': 'यह कितनी दूर है?',

    // Emergencies and health (missing ones)
    'pharmacy': 'फार्मेसी',
    'ambulance': 'एम्बुलेंस',
    'police': 'पुलिस',
    'fire': 'आग',
    'Call an ambulance!': 'एम्बुलेंस बुलाएं!',
    'I feel sick.': 'मैं बीमार महसूस कर रहा हूं।',
    'I lost my passport.': 'मैंने अपना पासपोर्ट खो दिया है।',
    'Where is the nearest hospital?': 'निकटतम अस्पताल कहाँ है?',
    'I have a headache.': 'मुझे सिरदर्द है।',
    'Call the police!': 'पुलिस बुलाएं!',

    // Weather and nature (missing ones)
    'sunny': 'धूप',
    'rainy': 'बारिश',
    'cloudy': 'बादल',
    'windy': 'हवा',
    'snow': 'बर्फ',
    'tree': 'पेड़',
    'flower': 'फूल',
    'mountain': 'पहाड़',
    'ocean': 'समुद्र',
    'forest': 'जंगल',
    'It is sunny today.': 'आज धूप है।',
    'The weather is nice.': 'मौसम अच्छा है।',
    'It might rain later.': 'बाद में बारिश हो सकती है।',
    'The wind is very strong.': 'हवा बहुत तेज है।',
    'I love walking in the forest.': 'मुझे जंगल में घूमना बहुत पसंद है।',
    'The mountain view is beautiful.': 'पहाड़ का दृश्य बहुत सुंदर है।',
    'These flowers are lovely.': 'ये फूल बहुत सुंदर हैं।',
    'The ocean is very blue.': 'समुद्र बहुत नीला है।',
    'What is the weather like?': 'मौसम कैसा है?',
    'I hope it does not snow.': 'मुझे उम्मीद है कि बर्फ नहीं पड़ेगी।',

    // Additional missing phrases
    'I speak a little.': 'मैं थोड़ी बोलता हूं।',
    'What do you do?': 'आप क्या करते हैं?',

    // Additional shopping words
    'expensive': 'महंगा',
    'cheap': 'सस्ता',
    'How much is this?': 'इसकी कीमत कितनी है?',
    'Do you take cards?': 'क्या आप कार्ड लेते हैं?',
    'I am just looking.': 'मैं सिर्फ देख रहा हूं।',
    'Can I try it on?': 'क्या मैं इसे पहन कर देख सकता हूं?',
    'Do you have this in blue?': 'क्या आपके पास यह नीले रंग में है?',
    'Where is the changing room?': 'चेंजिंग रूम कहाँ है?',
    'Can I get a receipt?': 'क्या मुझे रसीद मिल सकती है?',
    'This is too expensive.': 'यह बहुत महंगा है।',
    'Do you accept returns?': 'क्या आप रिटर्न स्वीकार करते हैं?',

    // Work & Profession
    'Work & Profession': 'काम और पेशा',
    'work': 'काम',
    'job': 'नौकरी',
    'office': 'कार्यालय',
    'meeting': 'बैठक',
    'boss': 'मालिक',
    'colleague': 'सहकर्मी',
    'salary': 'वेतन',
    'project': 'प्रोजेक्ट',
    'deadline': 'समय सीमा',
    'career': 'करियर',
    'What do you do for work?': 'आप काम के लिए क्या करते हैं?',
    'I work in an office.': 'मैं एक कार्यालय में काम करता हूं।',
    'Do you like your job?': 'क्या आपको अपनी नौकरी पसंद है?',
    'I have a meeting at nine.': 'मेरी नौ बजे बैठक है।',
    'My boss is very nice.': 'मेरा मालिक बहुत अच्छा है।',
    'I work with great colleagues.': 'मैं बेहतरीन सहकर्मियों के साथ काम करता हूं।',
    'What is your salary?': 'आपका वेतन क्या है?',
    'I work from nine to five.': 'मैं नौ से पांच बजे तक काम करता हूं।',
    'Do you have a lot of work?': 'क्या आपके पास बहुत काम है?',
    'I need to finish this project.': 'मुझे यह प्रोजेक्ट पूरा करना है।',
    'What time do you start work?': 'आप काम कब शुरू करते हैं?',
    'I want to advance my career.': 'मैं अपना करियर आगे बढ़ाना चाहता हूं।',
    'My job is very interesting.': 'मेरी नौकरी बहुत दिलचस्प है।',
    'I have a good salary.': 'मेरा वेतन अच्छा है।',
    'Work is very important.': 'काम बहुत महत्वपूर्ण है।',

    // Health & Medical
    'Health & Medical': 'स्वास्थ्य और चिकित्सा',
    'health': 'स्वास्थ्य',
    'doctor': 'डॉक्टर',
    'hospital': 'अस्पताल',
    'medicine': 'दवा',
    'pain': 'दर्द',
    'sick': 'बीमार',
    'better': 'बेहतर',
    'worse': 'बदतर',
    'emergency': 'आपातकाल',
    'appointment': 'अपॉइंटमेंट',
    'I am sick.': 'मैं बीमार हूं।',
    'I need a doctor.': 'मुझे डॉक्टर की जरूरत है।',
    'Where is the hospital?': 'अस्पताल कहाँ है?',
    'I have pain.': 'मुझे दर्द है।',
    'Do you have medicine?': 'क्या आपके पास दवा है?',
    'I feel better.': 'मैं बेहतर महसूस कर रहा हूं।',
    'This is an emergency.': 'यह एक आपातकाल है।',
    'I have an appointment.': 'मेरी अपॉइंटमेंट है।',
    'What is wrong with me?': 'मुझे क्या हुआ है?',
    'I need help.': 'मुझे मदद की जरूरत है।',
    'Are you okay?': 'क्या आप ठीक हैं?',
    'Health is very important.': 'स्वास्थ्य बहुत महत्वपूर्ण है।',
    'I want to see a doctor.': 'मैं डॉक्टर से मिलना चाहता हूं।',
    'Please help me.': 'कृपया मेरी मदद करें।',
    'Thank you doctor.': 'धन्यवाद डॉक्टर।',

    // Education & Learning
    'Education & Learning': 'शिक्षा और सीखना',
    'school': 'स्कूल',
    'student': 'छात्र',
    'teacher': 'शिक्षक',
    'class': 'कक्षा',
    'lesson': 'पाठ',
    'homework': 'होमवर्क',
    'exam': 'परीक्षा',
    'grade': 'ग्रेड',
    'study': 'पढ़ाई',
    'learn': 'सीखना',
    'What subject do you study?': 'आप कौन सा विषय पढ़ते हैं?',
    'I am a student at university.': 'मैं विश्वविद्यालय में छात्र हूं।',
    'My teacher is very good.': 'मेरे शिक्षक बहुत अच्छे हैं।',
    'What time does class start?': 'कक्षा कब शुरू होती है?',
    'I have a lot of homework.': 'मेरे पास बहुत होमवर्क है।',
    'When is your next exam?': 'आपकी अगली परीक्षा कब है?',
    'What grade did you get?': 'आपको क्या ग्रेड मिला?',
    'I need to study for the test.': 'मुझे टेस्ट के लिए पढ़ाई करनी है।',
    'This lesson is very interesting.': 'यह पाठ बहुत दिलचस्प है।',
    'I want to learn English.': 'मैं अंग्रेजी सीखना चाहता हूं।',
    'Education is very important.': 'शिक्षा बहुत महत्वपूर्ण है।',
    'I love learning new things.': 'मुझे नई चीजें सीखना पसंद है।',
    'My school is very big.': 'मेरा स्कूल बहुत बड़ा है।',
    'I have class tomorrow.': 'कल मेरी कक्षा है।',
    'Learning is fun.': 'सीखना मजेदार है।',

    // Sports & Exercise
    'Sports & Exercise': 'खेल और व्यायाम',
    'sport': 'खेल',
    'football': 'फुटबॉल',
    'basketball': 'बास्केटबॉल',
    'tennis': 'टेनिस',
    'swimming': 'तैराकी',
    'running': 'दौड़ना',
    'exercise': 'व्यायाम',
    'team': 'टीम',
    'player': 'खिलाड़ी',
    'game': 'खेल',
    'Do you like sports?': 'क्या आपको खेल पसंद हैं?',
    'I love playing football.': 'मुझे फुटबॉल खेलना बहुत पसंद है।',
    'What sport do you play?': 'आप कौन सा खेल खेलते हैं?',
    'I go swimming every week.': 'मैं हर हफ्ते तैराकी करने जाता हूं।',
    'Do you exercise regularly?': 'क्या आप नियमित रूप से व्यायाम करते हैं?',
    'I run every morning.': 'मैं हर सुबह दौड़ता हूं।',
    'Are you good at tennis?': 'क्या आप टेनिस में अच्छे हैं?',
    'I want to join a sports team.': 'मैं एक खेल टीम में शामिल होना चाहता हूं।',
    'Sports are good for health.': 'खेल स्वास्थ्य के लिए अच्छे हैं।',
    'I play basketball with friends.': 'मैं दोस्तों के साथ बास्केटबॉल खेलता हूं।',
    'What is your favorite sport?': 'आपका पसंदीदा खेल क्या है?',
    'I need to exercise more.': 'मुझे और व्यायाम करने की जरूरत है।',
    'Playing sports is fun.': 'खेल खेलना मजेदार है।',
    'I want to be a professional player.': 'मैं एक पेशेवर खिलाड़ी बनना चाहता हूं।',
    'Exercise makes me feel good.': 'व्यायाम करने से मुझे अच्छा लगता है।',

    // Travel & Transportation
    'Travel & Transportation': 'यात्रा और परिवहन',
    'travel': 'यात्रा',
    'trip': 'यात्रा',
    'journey': 'सफर',
    'airport': 'हवाई अड्डा',
    'station': 'स्टेशन',
    'bus': 'बस',
    'train': 'ट्रेन',
    'plane': 'हवाई जहाज',
    'car': 'कार',
    'ticket': 'टिकट',
    'Where are you going?': 'आप कहाँ जा रहे हैं?',
    'I am going on a trip.': 'मैं एक यात्रा पर जा रहा हूं।',
    'How do I get to the airport?': 'मैं हवाई अड्डे तक कैसे पहुंचूं?',
    'What time does the train leave?': 'ट्रेन कब जाती है?',
    'I need a ticket to London.': 'मुझे लंदन के लिए टिकट चाहिए।',
    'How long is the journey?': 'यात्रा कितनी लंबी है?',
    'Do you like traveling?': 'क्या आपको यात्रा करना पसंद है?',
    'I want to visit Paris.': 'मैं पेरिस जाना चाहता हूं।',
    'What is the best way to travel?': 'यात्रा करने का सबसे अच्छा तरीका क्या है?',
    'I prefer traveling by train.': 'मुझे ट्रेन से यात्रा करना पसंद है।',
    'How much does the ticket cost?': 'टिकट की कीमत कितनी है?',
    'Traveling is very exciting.': 'यात्रा करना बहुत रोमांचक है।',
    'I love visiting new places.': 'मुझे नई जगहें देखना बहुत पसंद है।',
    'What countries have you visited?': 'आपने कौन से देश देखे हैं?',
    'Traveling broadens your mind.': 'यात्रा करने से दिमाग खुलता है।',

    // Hobbies & Entertainment
    'Hobbies & Entertainment': 'शौक और मनोरंजन',
    'hobby': 'शौक',
    'music': 'संगीत',
    'movie': 'फिल्म',
    'book': 'किताब',
    'painting': 'चित्रकला',
    'cooking': 'खाना बनाना',
    'garden': 'बगीचा',
    'photography': 'फोटोग्राफी',
    'dancing': 'नृत्य',
    'singing': 'गायन',
    'What is your hobby?': 'आपका शौक क्या है?',
    'I love listening to music.': 'मुझे संगीत सुनना बहुत पसंद है।',
    'Do you like watching movies?': 'क्या आपको फिल्में देखना पसंद है?',
    'I enjoy reading books.': 'मुझे किताबें पढ़ना अच्छा लगता है।',
    'What kind of music do you like?': 'आपको किस तरह का संगीत पसंद है?',
    'I want to learn to paint.': 'मैं चित्रकला सीखना चाहता हूं।',
    'Cooking is my favorite hobby.': 'खाना बनाना मेरा पसंदीदा शौक है।',
    'My garden is very beautiful.': 'मेरा बगीचा बहुत सुंदर है।',
    'Do you like dancing?': 'क्या आपको नृत्य करना पसंद है?',
    'I love taking photographs.': 'मुझे फोटो खींचना बहुत पसंद है।',
    'What do you do for fun?': 'आप मनोरंजन के लिए क्या करते हैं?',
    'Hobbies make life interesting.': 'शौक जीवन को दिलचस्प बनाते हैं।',
    'I want to try new hobbies.': 'मैं नए शौक आजमाना चाहता हूं।',
    'Entertainment is important.': 'मनोरंजन महत्वपूर्ण है।',
    'I love my hobbies.': 'मुझे अपने शौक बहुत पसंद हैं।',

    // Emotions & Feelings
    'Emotions & Feelings': 'भावनाएं और एहसास',
    'happy': 'खुश',
    'sad': 'दुखी',
    'angry': 'गुस्सा',
    'excited': 'उत्साहित',
    'nervous': 'घबराया हुआ',
    'tired': 'थका हुआ',
    'scared': 'डरा हुआ',
    'surprised': 'आश्चर्यचकित',
    'confused': 'उलझन में',
    'proud': 'गर्वित',
    'How are you feeling?': 'आप कैसा महसूस कर रहे हैं?',
    'I am very happy today.': 'आज मैं बहुत खुश हूं।',
    'Why are you sad?': 'आप दुखी क्यों हैं?',
    'I feel excited about the trip.': 'मुझे यात्रा के बारे में उत्साह महसूस हो रहा है।',
    'Are you angry with me?': 'क्या आप मुझसे गुस्सा हैं?',
    'I am nervous about the exam.': 'मैं परीक्षा के बारे में घबरा रहा हूं।',
    'What makes you happy?': 'आपको क्या खुश करता है?',
    'I feel tired after work.': 'काम के बाद मुझे थकान महसूस होती है।',
    'Don\'t be scared.': 'डरो मत।',
    'I am surprised by the news.': 'मैं खबर से आश्चर्यचकित हूं।',
    'Emotions are very important.': 'भावनाएं बहुत महत्वपूर्ण हैं।',
    'I am proud of my achievement.': 'मुझे अपनी उपलब्धि पर गर्व है।',
    'Feelings can change quickly.': 'भावनाएं जल्दी बदल सकती हैं।',
    'I understand your feelings.': 'मैं आपकी भावनाओं को समझता हूं।',
    'Emotions are part of life.': 'भावनाएं जीवन का हिस्सा हैं।',

    // Time & Dates
    'Time & Dates': 'समय और तारीखें',
    'time': 'समय',
    'hour': 'घंटा',
    'minute': 'मिनट',
    'second': 'सेकंड',
    'morning': 'सुबह',
    'afternoon': 'दोपहर',
    'evening': 'शाम',
    'night': 'रात',
    'today': 'आज',
    'tomorrow': 'कल',
    'What time is it?': 'क्या समय हुआ है?',
    'It is nine o\'clock.': 'नौ बजे हैं।',
    'What day is it today?': 'आज कौन सा दिन है?',
    'Today is Monday.': 'आज सोमवार है।',
    'What date is it today?': 'आज कौन सी तारीख है?',
    'Today is the fifteenth.': 'आज पंद्रह तारीख है।',
    'What month is it?': 'कौन सा महीना है?',
    'It is January.': 'जनवरी है।',
    'What year is it?': 'कौन सा साल है?',
    'It is two thousand twenty four.': 'दो हजार चौबीस है।',
    'Time is very precious.': 'समय बहुत कीमती है।',
    'I am late for work.': 'मैं काम के लिए देर से हूं।',
    'What time do you start?': 'आप कब शुरू करते हैं?',
    'Time flies very fast.': 'समय बहुत तेजी से बीतता है।',
    'I need to check the time.': 'मुझे समय देखने की जरूरत है।',

    // Numbers & Quantities
    'Numbers & Quantities': 'संख्या और मात्रा',
    'one': 'एक',
    'two': 'दो',
    'three': 'तीन',
    'four': 'चार',
    'five': 'पांच',
    'six': 'छह',
    'seven': 'सात',
    'eight': 'आठ',
    'nine': 'नौ',
    'ten': 'दस',
    'How many?': 'कितने?',
    'I need two tickets.': 'मुझे दो टिकट चाहिए।',
    'How much does it cost?': 'इसकी कीमत कितनी है?',
    'I want three apples.': 'मुझे तीन सेब चाहिए।',
    'There are five people.': 'पांच लोग हैं।',
    'How many hours?': 'कितने घंटे?',
    'I have seven days.': 'मेरे पास सात दिन हैं।',
    'What is the total?': 'कुल क्या है?',
    'Numbers are important.': 'संख्या महत्वपूर्ण हैं।',
    'I count to ten.': 'मैं दस तक गिनता हूं।',
    'How many people are here?': 'यहाँ कितने लोग हैं?',
    'Quantities matter.': 'मात्रा मायने रखती है।',
    'I need more.': 'मुझे और चाहिए।',
    'That is enough.': 'वह काफी है।',
    'Numbers help us count.': 'संख्या हमें गिनने में मदद करती हैं।',

    // Colors & Appearance
    'Colors & Appearance': 'रंग और रूप',
    'color': 'रंग',
    'red': 'लाल',
    'blue': 'नीला',
    'green': 'हरा',
    'yellow': 'पीला',
    'black': 'काला',
    'white': 'सफेद',
    'big': 'बड़ा',
    'small': 'छोटा',
    'beautiful': 'सुंदर',
    'What color is it?': 'यह किस रंग का है?',
    'I like blue.': 'मुझे नीला रंग पसंद है।',
    'What is your favorite color?': 'आपका पसंदीदा रंग क्या है?',
    'This car is red.': 'यह कार लाल है।',
    'How big is it?': 'यह कितना बड़ा है?',
    'It is very small.': 'यह बहुत छोटा है।',
    'You look beautiful.': 'आप बहुत सुंदर लग रहे हैं।',
    'Colors are very important.': 'रंग बहुत महत्वपूर्ण हैं।',
    'I want a white shirt.': 'मुझे सफेद शर्ट चाहिए।',
    'This flower is yellow.': 'यह फूल पीला है।',
    'Appearance matters.': 'रूप मायने रखता है।',
    'What size do you need?': 'आपको क्या साइज चाहिए?',
    'Colors make life beautiful.': 'रंग जीवन को सुंदर बनाते हैं।',
    'I prefer dark colors.': 'मुझे गहरे रंग पसंद हैं।',
    'Beauty is in the eye of the beholder.': 'सुंदरता देखने वाले की आंख में होती है।',

    // Food & Drinks
    'Food & Drinks': 'भोजन और पेय',
    'food': 'भोजन',
    'drink': 'पेय',
    'water': 'पानी',
    'bread': 'रोटी',
    'rice': 'चावल',
    'meat': 'मांस',
    'vegetables': 'सब्जियां',
    'fruit': 'फल',
    'milk': 'दूध',
    'coffee': 'कॉफी',
    'Are you hungry?': 'क्या आप भूखे हैं?',
    'I am very hungry.': 'मैं बहुत भूखा हूं।',
    'What would you like to eat?': 'आप क्या खाना चाहेंगे?',
    'I want some water.': 'मुझे कुछ पानी चाहिए।',
    'Do you like Indian food?': 'क्या आपको भारतीय भोजन पसंद है?',
    'This food is delicious.': 'यह भोजन बहुत स्वादिष्ट है।',
    'I prefer vegetarian food.': 'मुझे शाकाहारी भोजन पसंद है।',
    'What is for dinner?': 'रात के खाने में क्या है?',
    'I love fruits.': 'मुझे फल बहुत पसंद हैं।',
    'Do you want some coffee?': 'क्या आप कुछ कॉफी चाहेंगे?',
    'Food is essential for life.': 'भोजन जीवन के लिए आवश्यक है।',
    'I need to eat breakfast.': 'मुझे नाश्ता करने की जरूरत है।',
    'What is your favorite food?': 'आपका पसंदीदा भोजन क्या है?',
    'Drinking water is healthy.': 'पानी पीना स्वास्थ्य के लिए अच्छा है।',
    'I enjoy cooking.': 'मुझे खाना बनाना अच्छा लगता है।',

    // Clothing & Fashion
    'Clothing & Fashion': 'कपड़े और फैशन',
    'clothes': 'कपड़े',
    'shirt': 'शर्ट',
    'pants': 'पैंट',
    'dress': 'ड्रेस',
    'shoes': 'जूते',
    'hat': 'टोपी',
    'bag': 'बैग',
    'jewelry': 'गहने',
    'style': 'स्टाइल',
    'fashion': 'फैशन',
    'What are you wearing?': 'आप क्या पहने हुए हैं?',
    'I like your shirt.': 'मुझे आपकी शर्ट पसंद है।',
    'Where did you buy those shoes?': 'आपने वे जूते कहाँ से खरीदे?',
    'Do you like fashion?': 'क्या आपको फैशन पसंद है?',
    'What size do you wear?': 'आप क्या साइज पहनते हैं?',
    'I need new clothes.': 'मुझे नए कपड़े चाहिए।',
    'This dress is beautiful.': 'यह ड्रेस बहुत सुंदर है।',
    'Do you like this style?': 'क्या आपको यह स्टाइल पसंद है?',
    'Fashion is very important.': 'फैशन बहुत महत्वपूर्ण है।',
    'I want to buy a new bag.': 'मैं एक नया बैग खरीदना चाहता हूं।',
    'Clothes make a person.': 'कपड़े इंसान को बनाते हैं।',
    'What is your favorite color for clothes?': 'कपड़ों के लिए आपका पसंदीदा रंग क्या है?',
    'I love shopping for clothes.': 'मुझे कपड़े खरीदना बहुत पसंद है।',
    'Style is personal.': 'स्टाइल व्यक्तिगत होता है।',
    'Clothes should be comfortable.': 'कपड़े आरामदायक होने चाहिए।',

    // Home & Furniture
    'Home & Furniture': 'घर और फर्नीचर',
    'home': 'घर',
    'house': 'मकान',
    'room': 'कमरा',
    'kitchen': 'रसोई',
    'bathroom': 'बाथरूम',
    'bedroom': 'शयनकक्ष',
    'table': 'मेज',
    'chair': 'कुर्सी',
    'bed': 'बिस्तर',
    'door': 'दरवाजा',
    'Where do you live?': 'आप कहाँ रहते हैं?',
    'I live in a house.': 'मैं एक घर में रहता हूं।',
    'How many rooms do you have?': 'आपके पास कितने कमरे हैं?',
    'Where is the bathroom?': 'बाथरूम कहाँ है?',
    'I love my home.': 'मुझे अपना घर बहुत पसंद है।',
    'This furniture is very nice.': 'यह फर्नीचर बहुत अच्छा है।',
    'Do you have a garden?': 'क्या आपके पास बगीचा है?',
    'My kitchen is very big.': 'मेरी रसोई बहुत बड़ी है।',
    'Home is where the heart is.': 'घर वहीं है जहाँ दिल है।',
    'I need new furniture.': 'मुझे नया फर्नीचर चाहिए।',
    'What is your favorite room?': 'आपका पसंदीदा कमरा कौन सा है?',
    'Furniture makes a home beautiful.': 'फर्नीचर घर को सुंदर बनाता है।',
    'I want to decorate my home.': 'मैं अपना घर सजाना चाहता हूं।',
    'Comfort is important at home.': 'घर में आराम महत्वपूर्ण है।',
    'Home sweet home.': 'घर मेरा घर है।',

    // Animals & Pets
    'Animals & Pets': 'जानवर और पालतू',
    'animal': 'जानवर',
    'pet': 'पालतू',
    'dog': 'कुत्ता',
    'cat': 'बिल्ली',
    'bird': 'पक्षी',
    'fish': 'मछली',
    'horse': 'घोड़ा',
    'cow': 'गाय',
    'chicken': 'मुर्गी',
    'rabbit': 'खरगोश',
    'Do you have a pet?': 'क्या आपके पास कोई पालतू जानवर है?',
    'I have a dog.': 'मेरे पास एक कुत्ता है।',
    'What is your favorite animal?': 'आपका पसंदीदा जानवर कौन सा है?',
    'Animals are amazing.': 'जानवर अद्भुत हैं।',
    'My cat is very cute.': 'मेरी बिल्ली बहुत प्यारी है।',
    'Do you like dogs?': 'क्या आपको कुत्ते पसंद हैं?',
    'Pets are good companions.': 'पालतू जानवर अच्छे साथी होते हैं।',
    'I want to get a pet.': 'मैं एक पालतू जानवर लेना चाहता हूं।',
    'What animals do you see?': 'आप कौन से जानवर देखते हैं?',
    'Animals are important for nature.': 'जानवर प्रकृति के लिए महत्वपूर्ण हैं।',
    'My dog is very loyal.': 'मेरा कुत्ता बहुत वफादार है।',
    'Do you have any pets?': 'क्या आपके पास कोई पालतू जानवर है?',
    'Pets need love and care.': 'पालतू जानवरों को प्यार और देखभाल की जरूरत होती है।',
    'I love all animals.': 'मुझे सभी जानवर पसंद हैं।',
    'Animals are our friends.': 'जानवर हमारे दोस्त हैं।',

    // Communication & Language
    'Communication & Language': 'संचार और भाषा',
    'communication': 'संचार',
    'language': 'भाषा',
    'speak': 'बोलना',
    'listen': 'सुनना',
    'understand': 'समझना',
    'explain': 'समझाना',
    'question': 'प्रश्न',
    'answer': 'उत्तर',
    'conversation': 'बातचीत',
    'discussion': 'चर्चा',
    'Do you speak Hindi?': 'क्या आप हिंदी बोलते हैं?',
    'I want to learn English.': 'मैं अंग्रेजी सीखना चाहता हूं।',
    'Can you understand me?': 'क्या आप मुझे समझ सकते हैं?',
    'What language do you speak?': 'आप कौन सी भाषा बोलते हैं?',
    'Communication is very important.': 'संचार बहुत महत्वपूर्ण है।',
    'I love learning new languages.': 'मुझे नई भाषाएं सीखना बहुत पसंद है।',
    'Can you explain this?': 'क्या आप इसे समझा सकते हैं?',
    'I have a question.': 'मेरे पास एक प्रश्न है।',
    'Language connects people.': 'भाषा लोगों को जोड़ती है।',
    'Do you like conversations?': 'क्या आपको बातचीत पसंद है?',
    'Communication helps us connect.': 'संचार हमें जोड़ने में मदद करता है।',
    'I enjoy discussions.': 'मुझे चर्चाएं करना अच्छा लगता है।',
    'What is your native language?': 'आपकी मातृभाषा क्या है?',
    'Language is a tool.': 'भाषा एक उपकरण है।',
    'Communication brings people together.': 'संचार लोगों को एक साथ लाता है।',

    // Advanced Phrases
    'Advanced Phrases': 'उन्नत वाक्यांश',
    'nevertheless': 'फिर भी',
    'furthermore': 'इसके अलावा',
    'otherwise': 'अन्यथा',
    'meanwhile': 'इस बीच',
    'consequently': 'नतीजतन',
    'approximately': 'लगभग',
    'occasionally': 'कभी-कभी',
    'gradually': 'धीरे-धीरे',
    'ultimately': 'अंततः',
    'essentially': 'मूल रूप से',
    'Nevertheless, I still want to try.': 'फिर भी, मैं अभी भी कोशिश करना चाहता हूं।',
    'Furthermore, I believe this is correct.': 'इसके अलावा, मुझे विश्वास है कि यह सही है।',
    'We must leave now, otherwise we will be late.': 'हमें अभी जाना होगा, अन्यथा हम देर हो जाएंगे।',
    'Meanwhile, I will prepare dinner.': 'इस बीच, मैं रात का खाना तैयार करूंगा।',
    'Consequently, the meeting was cancelled.': 'नतीजतन, बैठक रद्द कर दी गई।',
    'It will cost approximately fifty dollars.': 'इसकी कीमत लगभग पचास डॉलर होगी।',
    'I occasionally visit my grandparents.': 'मैं कभी-कभी अपने दादा-दादी से मिलने जाता हूं।',
    'Gradually, I learned to speak English.': 'धीरे-धीरे, मैंने अंग्रेजी बोलना सीखा।',
    'Ultimately, success comes to those who work hard.': 'अंततः, सफलता उन्हीं को मिलती है जो कड़ी मेहनत करते हैं।',
    'Essentially, this is a simple problem.': 'मूल रूप से, यह एक सरल समस्या है।',
    'Advanced phrases improve communication.': 'उन्नत वाक्यांश संचार को बेहतर बनाते हैं।',
    'Learning advanced language takes time.': 'उन्नत भाषा सीखने में समय लगता है।',
    'Practice makes perfect.': 'अभ्यास परिपूर्ण बनाता है।',
    'Advanced phrases show mastery.': 'उन्नत वाक्यांश निपुणता दिखाते हैं।',
    'Language learning is a journey.': 'भाषा सीखना एक यात्रा है।',

    // Additional missing words and phrases
    'Shopping & Money': 'खरीदारी और पैसा',
    'Family & Relationships': 'परिवार और रिश्ते',
    'Travel & Hotel': 'यात्रा और होटल',
    'Food & Drink Basics': 'भोजन और पेय के मूल',
    'Getting Around': 'आसपास जाना',
    'Core Verbs & Pronouns': 'मूल क्रियाएं और सर्वनाम',
    'Numbers & Time Basics': 'संख्या और समय के मूल',
    'Emergencies & Health': 'आपातकाल और स्वास्थ्य',
    'Daily Routines': 'दैनिक दिनचर्या',
    'Family & People': 'परिवार और लोग',
    'Weather & Small Talk': 'मौसम और छोटी बातचीत',
    'Work & Study': 'काम और पढ़ाई',
    'Plans & Invitations': 'योजनाएं और निमंत्रण',
    'Requests & Help': 'अनुरोध और मदद',
    'Phone & Internet': 'फोन और इंटरनेट',
    'Restaurant': 'रेस्तरां',
    'Transportation Details': 'परिवहन के विवरण',
    'Housing & Utilities': 'आवास और उपयोगिताएं',
    'Connectors & Advanced': 'कनेक्टर और उन्नत',
    'Technology Basics': 'प्रौद्योगिकी के मूल',
    'Weather & Nature': 'मौसम और प्रकृति',
    'Communication & Language': 'संचार और भाषा',
    'Advanced Phrases': 'उन्नत वाक्यांश'
  }
};

// Function to translate text
function translateText(text, targetLang) {
  const langTranslations = translations[targetLang];
  if (!langTranslations) {
    console.log(`❌ No translations found for language: ${targetLang}`);
    return text;
  }
  
  // Check if we have a direct translation
  if (langTranslations[text]) {
    return langTranslations[text];
  }
  
  // If no translation found, return original text
  return text;
}

// Function to translate a file
function translateFile(filePath, targetLang) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Update language field
    const languageMap = {
      'hi': 'Hindi',
      'pl': 'Polish',
      'nl': 'Dutch',
      'el': 'Greek',
      'sv': 'Swedish',
      'no': 'Norwegian',
      'fi': 'Finnish',
      'cs': 'Czech',
      'uk': 'Ukrainian',
      'he': 'Hebrew',
      'th': 'Thai',
      'vi': 'Vietnamese'
    };
    
    data.language = languageMap[targetLang];
    
    // Translate title
    if (data.title) {
      data.title = translateText(data.title, targetLang);
    }
    
    // Translate items
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach(item => {
        if (item.text) {
          item.text = translateText(item.text, targetLang);
        }
      });
    }
    
    // Write translated content back to file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Translated: ${path.basename(filePath)}`);
    
  } catch (error) {
    console.error(`❌ Error translating ${filePath}:`, error.message);
  }
}

// Function to translate all files in a language folder
function translateLanguageFolder(langCode) {
  const langFolder = path.join(__dirname, langCode);
  
  if (!fs.existsSync(langFolder)) {
    console.log(`❌ Language folder not found: ${langCode}`);
    return;
  }
  
  console.log(`\n🚀 Starting translation for language: ${langCode}`);
  
  const files = fs.readdirSync(langFolder).filter(file => file.endsWith('.json'));
  
  files.forEach(file => {
    const filePath = path.join(langFolder, file);
    translateFile(filePath, langCode);
  });
  
  console.log(`✅ Completed translation for language: ${langCode}`);
}

// Main execution
if (require.main === module) {
  const targetLang = process.argv[2];
  
  if (!targetLang) {
    console.log('❌ Please provide a language code (e.g., node translate-single-language.js hi)');
    process.exit(1);
  }
  
  if (!translations[targetLang]) {
    console.log(`❌ No translations available for language: ${targetLang}`);
    console.log('Available languages:', Object.keys(translations).join(', '));
    process.exit(1);
  }
  
  console.log(`🎯 Translating files for language: ${targetLang}`);
  translateLanguageFolder(targetLang);
  console.log('\n🎉 Translation completed!');
}
