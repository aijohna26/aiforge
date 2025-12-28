/**
 * Chat Recovery Script
 *
 * This script helps recover lost chat conversations from IndexedDB.
 * Run this in your browser's DevTools Console while on the app.
 */

async function recoverChat() {
  // Open IndexedDB
  const dbRequest = indexedDB.open('boltHistory', 2);

  return new Promise((resolve, reject) => {
    dbRequest.onsuccess = async (event) => {
      const db = event.target.result;

      // Get all chats
      const transaction = db.transaction('chats', 'readonly');
      const store = transaction.objectStore('chats');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const chats = getAllRequest.result;

        console.log(`Found ${chats.length} chat(s) in database`);
        console.log('');

        // Sort by timestamp (most recent first)
        chats.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Display all chats with details
        chats.forEach((chat, index) => {
          console.log(`Chat ${index + 1}:`);
          console.log(`  Description: ${chat.description || '(No description)'}`);
          console.log(`  ID: ${chat.id}`);
          console.log(`  URL ID: ${chat.urlId}`);
          console.log(`  Timestamp: ${chat.timestamp}`);
          console.log(`  Messages: ${chat.messages.length}`);

          // Show first user message preview
          const firstUserMsg = chat.messages.find(m => m.role === 'user');
          if (firstUserMsg) {
            const preview = typeof firstUserMsg.content === 'string'
              ? firstUserMsg.content.substring(0, 100)
              : JSON.stringify(firstUserMsg.content).substring(0, 100);
            console.log(`  First message: ${preview}...`);
          }

          console.log(`  URL: /chat/${chat.urlId || chat.id}`);
          console.log('');
        });

        // Find chats mentioning "Exam Scanner"
        const examScannerChats = chats.filter(chat => {
          const desc = chat.description?.toLowerCase() || '';
          const hasExamInDesc = desc.includes('exam') || desc.includes('scanner');

          const hasExamInMessages = chat.messages.some(msg => {
            const content = typeof msg.content === 'string' ? msg.content.toLowerCase() : '';
            return content.includes('exam') && content.includes('scanner');
          });

          return hasExamInDesc || hasExamInMessages;
        });

        if (examScannerChats.length > 0) {
          console.log('🎯 Found chat(s) related to "Exam Scanner":');
          examScannerChats.forEach(chat => {
            console.log(`  - ${chat.description || 'Untitled'}`);
            console.log(`    Navigate to: /chat/${chat.urlId || chat.id}`);
          });
        } else {
          console.log('⚠️  No chats found with "Exam Scanner" in description or messages.');
          console.log('   Check the list above for your chat.');
        }

        resolve(chats);
      };

      getAllRequest.onerror = () => reject(getAllRequest.error);
    };

    dbRequest.onerror = () => reject(dbRequest.error);
  });
}

// Run the recovery
console.log('🔍 Searching for lost chats...');
recoverChat().then(chats => {
  console.log('✅ Search complete!');
  console.log('');
  console.log('To navigate to a chat, copy one of the URLs above and change your browser URL.');
  console.log('Or use: window.location.href = "/chat/YOUR_CHAT_URL_ID"');
}).catch(err => {
  console.error('❌ Error recovering chats:', err);
});
