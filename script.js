
import { auth, db } from "./firebase.js";

import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ELEMEN HALAMAN
const loginScreen = document.getElementById("loginScreen");
const homeScreen = document.getElementById("homeScreen");
const chatScreen = document.getElementById("chatScreen");

const loginForm = document.getElementById("loginForm");
const registerButton = document.getElementById("registerButton");
const chatForm = document.getElementById("chatForm");

const messages = document.getElementById("messages");
const chatInput = document.getElementById("chatInput");
const pickerPanel = document.getElementById("pickerPanel");
const suggestionPanel = document.getElementById("suggestionPanel");
const emojiToggle = document.getElementById("emojiToggle");
const stickerToggle = document.getElementById("stickerToggle");
const mediaToggle = document.getElementById("mediaToggle");
const mediaPanel = document.getElementById("mediaPanel");
const replyPreview = document.getElementById("replyPreview");
const replyPreviewName = document.getElementById("replyPreviewName");
const replyPreviewText = document.getElementById("replyPreviewText");
const cancelReply = document.getElementById("cancelReply");

let selectedReply = null;

const emojiList = [
  "😀", "😂", "🥰", "😍", "😘", "😭",
  "🤣", "😎", "🤗", "😡", "❤️", "🔥",
  "👍", "🙏", "👏", "💯", "🥳", "🤔"
];

const stickerEmojis = [
  "🥰", "😍", "😘", "😂", "🤣", "😭",
  "😎", "🤗", "❤️", "🔥", "👍", "🙏",
  "🥳", "💯", "😴", "🤔"
];

const stickerSuggestions = [
  { words: ["love", "cinta", "sayang"], emoji: "🥰" },
  { words: ["haha", "wkwk", "lucu"], emoji: "😂" },
  { words: ["semangat"], emoji: "🔥" },
  { words: ["good night", "selamat tidur"], emoji: "😴" },
  { words: ["makasih", "terima kasih"], emoji: "🙏" },
  { words: ["maaf", "sorry"], emoji: "🥺" },
  { words: ["halo", "hai"], emoji: "👋" },
  { words: ["kangen", "rindu"], emoji: "😘" }
];
const message = document.getElementById("message");

const email = document.getElementById("email");
const password = document.getElementById("password");
const searchInput = document.getElementById("searchConversation");

let currentUser = null;
let currentRoomId = null;
let currentFilter = "all";

let stopMessages = null;
let stopRooms = null;

let roomsCache = [];
let latestMessages = new Map();
let latestUnsubs = new Map();
let deliveryUnsubs = new Map();

// TAMPILKAN HALAMAN
function showScreen(screen) {
  loginScreen.hidden = screen !== "login";
  homeScreen.hidden = screen !== "home";
  chatScreen.hidden = screen !== "chat";
}

// FORMAT WAKTU
function formatTime(timestamp) {
  if (!timestamp || !timestamp.toDate) return "";

  return timestamp.toDate().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

// LOGIN
loginForm.addEventListener("submit", async function(event) {
  event.preventDefault();
  message.textContent = "Sedang masuk...";

  try {
    await signInWithEmailAndPassword(
      auth,
      email.value.trim(),
      password.value
    );

    message.textContent = "";
  } catch (error) {
    message.textContent = "Login gagal: " + error.message;
  }
});

// DAFTAR AKUN
registerButton.addEventListener("click", async function() {
  const alamatEmail = email.value.trim();
  const kataSandi = password.value;

  if (!alamatEmail || !kataSandi) {
    message.textContent = "Isi email dan password terlebih dahulu.";
    return;
  }

  if (kataSandi.length < 6) {
    message.textContent = "Password minimal 6 karakter.";
    return;
  }

  message.textContent = "Membuat akun...";

  try {
    await createUserWithEmailAndPassword(
      auth,
      alamatEmail,
      kataSandi
    );

    message.textContent = "";
  } catch (error) {
    message.textContent = "Pendaftaran gagal: " + error.message;
  }
});

// BERSIHKAN LISTENER PESAN TERAKHIR
function clearLatestListeners() {
  latestUnsubs.forEach(function(unsubscribe) {
    unsubscribe();
  });

  deliveryUnsubs.forEach(function(unsubscribe) {
    unsubscribe();
  });

  latestUnsubs.clear();
  deliveryUnsubs.clear();
  latestMessages.clear();
}

// STATUS LOGIN
onAuthStateChanged(auth, async function(user) {
  currentUser = user;

  if (stopMessages) stopMessages();
  if (stopRooms) stopRooms();

  clearLatestListeners();

  stopMessages = null;
  stopRooms = null;
  currentRoomId = null;
  roomsCache = [];

  if (!user) {
    showScreen("login");
    return;
  }

  try {
    const profilRef = doc(db, "users", user.uid);
    const profilSnap = await getDoc(profilRef);

    if (!profilSnap.exists()) {
      await setDoc(profilRef, {
        uid: user.uid,
        email: user.email
      });
    }

    showScreen("home");
    loadConversations();

  } catch (error) {
    console.error(error);
    showScreen("login");
    alert("Gagal memuat profil: " + error.message);
  }
});

// MEMUAT DAFTAR RUANG
function loadConversations() {
  if (!currentUser) return;

  const ruangQuery = query(
    collection(db, "rooms"),
    where("members", "array-contains", currentUser.uid)
  );

  stopRooms = onSnapshot(
    ruangQuery,
    function(snapshot) {
      roomsCache = snapshot.docs.map(function(item) {
        return {
          id: item.id,
          ...item.data()
        };
      });

      updateLatestListeners();
      renderConversations();
    },
    function(error) {
      console.error("Gagal memuat ruang:", error);
      alert("Gagal memuat percakapan: " + error.message);
    }
  );
}

// MENDENGARKAN PESAN TERAKHIR SETIAP RUANG
function updateLatestListeners() {
  const roomIds = new Set(
    roomsCache.map(function(room) {
      return room.id;
    })
  );

  latestUnsubs.forEach(function(unsubscribe, roomId) {
    if (!roomIds.has(roomId)) {
      unsubscribe();
      latestUnsubs.delete(roomId);
      latestMessages.delete(roomId);
    }
  });

  deliveryUnsubs.forEach(function(unsubscribe, roomId) {
    if (!roomIds.has(roomId)) {
      unsubscribe();
      deliveryUnsubs.delete(roomId);
    }
  });

  roomsCache.forEach(function(room) {
    // LISTENER PESAN TERAKHIR
    if (!latestUnsubs.has(room.id)) {
      const pesanTerakhirQuery = query(
        collection(db, "rooms", room.id, "messages"),
        orderBy("createdAt", "desc"),
        limit(1)
      );

      const unsubscribe = onSnapshot(
        pesanTerakhirQuery,
        function(snapshot) {
          latestMessages.set(
            room.id,
            snapshot.empty ? null : snapshot.docs[0].data()
          );

          renderConversations();
        },
        function(error) {
          console.error("Gagal memuat pesan terakhir:", error);
        }
      );

      latestUnsubs.set(room.id, unsubscribe);
    }

    // LISTENER STATUS PESAN DITERIMA
    if (!deliveryUnsubs.has(room.id)) {
      const pesanMasukQuery = query(
        collection(db, "rooms", room.id, "messages"),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      const stopDelivery = onSnapshot(
        pesanMasukQuery,
        function(snapshot) {
          snapshot.forEach(function(item) {
            tandaiPesanDiterima(
              room.id,
              item.id,
              item.data()
            );
          });
        },
        function(error) {
          console.error("Gagal memantau pesan diterima:", error);
        }
      );

      deliveryUnsubs.set(room.id, stopDelivery);
    }
  });
}

// TAMPILKAN DAFTAR CHAT
function renderConversations() {
  const list = document.getElementById("conversationList");
  list.innerHTML = "";

  const kataKunci = searchInput.value.trim().toLowerCase();

  const filtered = roomsCache.filter(function(room) {
    const cocokFilter =
      currentFilter === "all" || room.type === currentFilter;

    const cocokCari =
      room.id.toLowerCase().includes(kataKunci);

    return cocokFilter && cocokCari;
  });

  filtered.sort(function(a, b) {
    const pesanA = latestMessages.get(a.id);
    const pesanB = latestMessages.get(b.id);

    const waktuA = pesanA?.createdAt?.toMillis?.() || 0;
    const waktuB = pesanB?.createdAt?.toMillis?.() || 0;

    return waktuB - waktuA;
  });

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-conversation";

    const icon = document.createElement("div");
    icon.textContent = "✉️";

    const title = document.createElement("h3");
    title.textContent = kataKunci
      ? "Percakapan tidak ditemukan"
      : "Belum ada percakapan";

    const info = document.createElement("p");
    info.textContent = kataKunci
      ? "Coba cari dengan kode ruang yang lain."
      : "Tekan tombol + untuk memulai percakapan.";

    empty.append(icon, title, info);
    list.appendChild(empty);
    return;
  }

  filtered.forEach(function(room) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "menu-card";

    const content = document.createElement("span");
    content.style.flex = "1";
    content.style.minWidth = "0";

    const title = document.createElement("strong");
    title.textContent = "Chat " + room.id.slice(0, 8);

    const detail = document.createElement("small");
    const lastMessage = latestMessages.get(room.id);

    detail.textContent = lastMessage
      ? lastMessage.text || "Pesan"
      : "Belum ada pesan";

    const time = document.createElement("small");
    time.textContent = lastMessage
      ? formatTime(lastMessage.createdAt)
      : "Baru";

    content.append(title, detail);
    button.append(content, time);

    button.addEventListener("click", function() {
      openRoom(room.id);
    });

    list.appendChild(button);
  });
}

// PENCARIAN CHAT
searchInput.addEventListener("input", renderConversations);

// BUAT RUANG CHAT
async function createPrivateRoom() {
  if (!currentUser) return;

  try {
    const roomRef = await addDoc(collection(db, "rooms"), {
      type: "private",
      members: [currentUser.uid],
      createdBy: currentUser.uid,
      createdAt: serverTimestamp()
    });

    const roomId = roomRef.id;

    alert(
      "Ruang berhasil dibuat!\n\n" +
      "Kode undangan:\n" + roomId +
      "\n\nBagikan kode ini kepada teman kamu."
    );

    openRoom(roomId);

  } catch (error) {
    console.error(error);
    alert("Gagal membuat ruang: " + error.message);
  }
}

// GABUNG DENGAN KODE UNDANGAN
async function joinPrivateRoom() {
  if (!currentUser) return;

  const code = prompt("Masukkan kode undangan DateChat:");

  if (!code) return;

  const roomId = code.trim();

  try {
    const roomRef = doc(db, "rooms", roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      alert("Kode undangan tidak ditemukan.");
      return;
    }

    const room = roomSnap.data();

    if (room.type !== "private" || !Array.isArray(room.members)) {
      alert("Ruang chat tidak valid.");
      return;
    }

    if (room.members.includes(currentUser.uid)) {
      openRoom(roomId);
      return;
    }

    if (room.members.length !== 1) {
      alert("Ruang sudah penuh atau tidak tersedia.");
      return;
    }

    await updateDoc(roomRef, {
      members: arrayUnion(currentUser.uid)
    });

    alert("Berhasil bergabung ke ruang chat!");

    openRoom(roomId);

  } catch (error) {
    console.error(error);
    alert("Gagal bergabung: " + error.message);
  }
}

// TOMBOL CHAT BARU (+)
document.getElementById("openPrivateChat")
  .addEventListener("click", function() {
    const pilihan = prompt(
      "CHAT BARU\n\n" +
      "1. Buat ruang baru\n" +
      "2. Gabung dengan kode undangan\n\n" +
      "Masukkan angka 1 atau 2:"
    );

    if (pilihan === "1") {
      createPrivateRoom();
    } else if (pilihan === "2") {
      joinPrivateRoom();
    }
  });

// STATUS PESAN DITERIMA
function tandaiPesanDiterima(roomId, messageId, data) {
  if (!currentUser || data.senderId === currentUser.uid) return;

  const delivered = Array.isArray(data.deliveredTo)
    ? data.deliveredTo : [];

  if (delivered.includes(currentUser.uid)) return;

  updateDoc(
    doc(db, "rooms", roomId, "messages", messageId),
    { deliveredTo: arrayUnion(currentUser.uid) }
  ).catch(function(error) {
    console.error("Gagal memperbarui status diterima:", error);
  });
}

// STATUS PESAN DIBACA
function tandaiPesanDibaca(roomId, messageId, data) {
  if (!currentUser || data.senderId === currentUser.uid) return;

  const delivered = Array.isArray(data.deliveredTo)
    ? data.deliveredTo : [];
  const read = Array.isArray(data.readBy)
    ? data.readBy : [];

  if (
    delivered.includes(currentUser.uid) &&
    read.includes(currentUser.uid)
  ) return;

  updateDoc(
    doc(db, "rooms", roomId, "messages", messageId),
    {
      deliveredTo: arrayUnion(currentUser.uid),
      readBy: arrayUnion(currentUser.uid)
    }
  ).catch(function(error) {
    console.error("Gagal memperbarui status dibaca:", error);
  });
}

// FITUR BALAS PESAN
function pilihPesanUntukDibalas(messageId, data) {
  selectedReply = {
    messageId: messageId,
    senderId: data.senderId,
    text: data.text || ""
  };

  replyPreviewName.textContent =
    data.senderId === currentUser.uid ? "Membalas pesan Anda" : "Membalas pesan";

  replyPreviewText.textContent = data.text || "(pesan kosong)";
  replyPreview.hidden = false;
  chatInput.focus();
}

function batalBalasPesan() {
  selectedReply = null;
  replyPreview.hidden = true;
  replyPreviewText.textContent = "";
}

cancelReply.addEventListener("click", batalBalasPesan);

// BUKA RUANG CHAT
function openRoom(roomId) {
  if (stopMessages) stopMessages();

  currentRoomId = roomId;
  showScreen("chat");

  document.getElementById("partnerName").textContent =
    "Chat " + roomId.slice(0, 8);

  messages.innerHTML = "";

  const pesanQuery = query(
    collection(db, "rooms", roomId, "messages"),
    orderBy("createdAt", "asc")
  );

  stopMessages = onSnapshot(
    pesanQuery,
    function(snapshot) {
      messages.innerHTML = "";

      if (snapshot.empty) {
        const welcome = document.createElement("div");
        welcome.className = "system-message";
        welcome.textContent = "Mulai percakapan di DateChat ❤️";
        messages.appendChild(welcome);
      }

      snapshot.forEach(function(item) {
        const data = item.data();

        // Tandai pesan dari lawan chat sebagai sudah dibaca
        tandaiPesanDibaca(roomId, item.id, data);

        const milikSaya = data.senderId === currentUser.uid;

        const bubble = document.createElement("div");
        bubble.className =
          "message-bubble " +
          (milikSaya ? "sent" : "received");

        if (stickerEmojis.includes(data.text)) {
          bubble.classList.add("sticker-message");
        }

        // Tampilkan kutipan pesan yang dibalas
        if (data.replyTo) {
          const kutipan = document.createElement("div");
          kutipan.className = "reply-quote";

          const namaKutipan = document.createElement("strong");
          namaKutipan.textContent =
            data.replyTo.senderId === currentUser.uid
              ? "Pesan Anda"
              : "Pesan lawan chat";

          const teksKutipan = document.createElement("span");
          teksKutipan.textContent = data.replyTo.text || "(pesan kosong)";

          kutipan.appendChild(namaKutipan);
          kutipan.appendChild(teksKutipan);
          bubble.appendChild(kutipan);
        }

        const isiPesan = document.createElement("div");
        isiPesan.className = "message-text";
        isiPesan.textContent = data.text || "";
        bubble.appendChild(isiPesan);

        // Geser pesan ke kanan untuk membalas
        let posisiAwalX = 0;
        let posisiAwalY = 0;

        bubble.addEventListener("touchstart", function(event) {
          const sentuhan = event.touches[0];
          posisiAwalX = sentuhan.clientX;
          posisiAwalY = sentuhan.clientY;
        }, { passive: true });

        bubble.addEventListener("touchend", function(event) {
          const sentuhan = event.changedTouches[0];
          const selisihX = sentuhan.clientX - posisiAwalX;
          const selisihY = sentuhan.clientY - posisiAwalY;

          if (selisihX > 65 && Math.abs(selisihX) > Math.abs(selisihY)) {
            pilihPesanUntukDibalas(item.id, data);
          }
        }, { passive: true });

        if (milikSaya) {
          const ruang = roomsCache.find(function(room) {
            return room.id === roomId;
          });

          const partnerUid = ruang && Array.isArray(ruang.members)
            ? ruang.members.find(function(uid) {
                return uid !== currentUser.uid;
              })
            : null;

          const delivered = Array.isArray(data.deliveredTo)
            ? data.deliveredTo : [];
          const read = Array.isArray(data.readBy)
            ? data.readBy : [];

          const status = document.createElement("span");
          status.className = "message-status";

          if (partnerUid && read.includes(partnerUid)) {
            status.textContent = "✓✓";
            status.classList.add("read");
          } else if (partnerUid && delivered.includes(partnerUid)) {
            status.textContent = "✓✓";
          } else {
            status.textContent = "✓";
          }

          bubble.appendChild(status);
        }

        messages.appendChild(bubble);
      });

      messages.scrollTop = messages.scrollHeight;
    },
    function(error) {
      console.error("Gagal memuat pesan:", error);
      alert("Gagal memuat pesan: " + error.message);
    }
  );
}

// KIRIM PESAN
chatForm.addEventListener("submit", async function(event) {
  event.preventDefault();

  const text = chatInput.value.trim();

  if (!text || !currentUser || !currentRoomId) return;

  const balasanAktif = selectedReply;

  const pesanBaru = {
    senderId: currentUser.uid,
    text: text,
    createdAt: serverTimestamp(),
    deliveredTo: [],
    readBy: []
  };

  if (balasanAktif) {
    pesanBaru.replyTo = {
      messageId: balasanAktif.messageId,
      senderId: balasanAktif.senderId,
      text: balasanAktif.text
    };
  }

  try {
    await addDoc(
      collection(db, "rooms", currentRoomId, "messages"),
      pesanBaru
    );

    chatInput.value = "";
    chatInput.style.height = "44px";
    suggestionPanel.hidden = true;

    if (selectedReply === balasanAktif) {
      batalBalasPesan();
    }

  } catch (error) {
    console.error(error);
    alert("Pesan gagal dikirim: " + error.message);
  }
});

// MENU LAMPIRAN FOTO DAN VIDEO
mediaToggle.addEventListener("click", function() {
  const akanDibuka = mediaPanel.hidden;

  tutupPicker();
  mediaPanel.hidden = !akanDibuka;
});

// KOLOM PESAN OTOMATIS MEMANJANG
chatInput.addEventListener("input", function() {
  this.style.height = "auto";
  this.style.height = Math.min(this.scrollHeight, 120) + "px";
});

// ENTER UNTUK KIRIM, SHIFT + ENTER UNTUK BARIS BARU
chatInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

// EMOJI DAN STICKER DATECHAT
function tutupPicker() {
  pickerPanel.hidden = true;
  suggestionPanel.hidden = true;
}

function bukaPicker(jenis) {
  suggestionPanel.hidden = true;

  if (!pickerPanel.hidden) {
    pickerPanel.hidden = true;
    return;
  }

  pickerPanel.innerHTML = "";
  pickerPanel.hidden = false;

  const daftar = jenis === "emoji" ? emojiList : stickerEmojis;

  daftar.forEach(function(simbol) {
    const tombol = document.createElement("button");
    tombol.type = "button";
    tombol.textContent = simbol;
    tombol.setAttribute("aria-label", simbol);

    tombol.addEventListener("click", async function() {
      if (jenis === "emoji") {
        chatInput.value += simbol;
        chatInput.focus();
        chatInput.dispatchEvent(new Event("input"));
      } else {
        await kirimSticker(simbol);
      }
    });

    pickerPanel.appendChild(tombol);
  });
}

async function kirimSticker(simbol) {
  if (!currentUser || !currentRoomId) return;

  try {
    await addDoc(
      collection(db, "rooms", currentRoomId, "messages"),
      {
        senderId: currentUser.uid,
        text: simbol,
        createdAt: serverTimestamp()
      }
    );

    tutupPicker();
  } catch (error) {
    console.error("Gagal mengirim sticker:", error);
    alert("Sticker gagal dikirim: " + error.message);
  }
}

emojiToggle.addEventListener("click", function() {
  bukaPicker("emoji");
});

stickerToggle.addEventListener("click", function() {
  bukaPicker("sticker");
});

// REKOMENDASI STICKER SAAT MENGETIK
chatInput.addEventListener("input", function() {
  const kata = chatInput.value.toLowerCase().trim();
  suggestionPanel.innerHTML = "";

  if (!kata) {
    suggestionPanel.hidden = true;
    return;
  }

  const cocok = stickerSuggestions.filter(function(item) {
    return item.words.some(function(word) {
      return kata.includes(word);
    });
  });

  if (cocok.length === 0) {
    suggestionPanel.hidden = true;
    return;
  }

  suggestionPanel.hidden = false;
  pickerPanel.hidden = true;

  cocok.forEach(function(item) {
    const tombol = document.createElement("button");
    tombol.type = "button";
    tombol.textContent = item.emoji;
    tombol.title = "Kirim sticker";

    tombol.addEventListener("click", function() {
      kirimSticker(item.emoji);
    });

    suggestionPanel.appendChild(tombol);
  });
});

// KEMBALI KE DAFTAR CHAT
document.getElementById("backHome")
  .addEventListener("click", function() {
    if (stopMessages) stopMessages();

    stopMessages = null;
    currentRoomId = null;

    showScreen("home");
  });

// KELUAR
async function logout() {
  try {
    if (stopMessages) stopMessages();
    if (stopRooms) stopRooms();

    clearLatestListeners();

    await signOut(auth);
  } catch (error) {
    alert("Gagal keluar: " + error.message);
  }
}

document.getElementById("logoutButton")
  .addEventListener("click", logout);

document.getElementById("logoutHome")
  .addEventListener("click", logout);

// FILTER PERCAKAPAN
document.querySelectorAll(".conversation-tabs button")
  .forEach(function(button) {
    button.addEventListener("click", function() {
      document.querySelectorAll(".conversation-tabs button")
        .forEach(function(item) {
          item.classList.remove("active");
        });

      button.classList.add("active");
      currentFilter = button.dataset.filter;

      renderConversations();
    });
  });

// FOTO DAN VIDEO BELUM TERHUBUNG KE SERVER
function handleMedia(inputId, type) {
  document.getElementById(inputId)
    .addEventListener("change", function() {
      const file = this.files[0];

      if (!file) return;

      alert(
        "File " + type + " dipilih: " + file.name +
        "\nPengiriman media online belum diaktifkan."
      );

      this.value = "";
    });
}

handleMedia("cameraPhotoInput", "foto dari kamera");
handleMedia("cameraVideoInput", "video dari kamera");
handleMedia("photoInput", "foto dari galeri");
handleMedia("videoInput", "video dari galeri");
