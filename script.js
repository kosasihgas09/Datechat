
import { auth, db } from "./firebase.js";

import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
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

const loginScreen = document.getElementById("loginScreen");
const homeScreen = document.getElementById("homeScreen");
const chatScreen = document.getElementById("chatScreen");

const loginForm = document.getElementById("loginForm");
const registerButton = document.getElementById("registerButton");
const chatForm = document.getElementById("chatForm");

const messages = document.getElementById("messages");
const chatInput = document.getElementById("chatInput");
const message = document.getElementById("message");

const email = document.getElementById("email");
const password = document.getElementById("password");

let currentUser = null;
let currentRoomId = null;
let currentFilter = "all";
let stopMessages = null;
let stopRooms = null;
let roomsCache = [];

// TAMPILKAN HALAMAN
function showScreen(screen) {
  loginScreen.hidden = screen !== "login";
  homeScreen.hidden = screen !== "home";
  chatScreen.hidden = screen !== "chat";
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

// STATUS LOGIN DAN PROFIL
onAuthStateChanged(auth, async function(user) {
  currentUser = user;

  if (stopMessages) stopMessages();
  if (stopRooms) stopRooms();

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
    showScreen("home");
    alert("Gagal memuat profil: " + error.message);
  }
});

// DAFTAR RUANG CHAT PENGGUNA
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

      renderConversations();
    },
    function(error) {
      console.error("Gagal memuat ruang:", error);
      alert("Gagal memuat percakapan: " + error.message);
    }
  );
}

// TAMPILKAN DAFTAR PERCAKAPAN
function renderConversations() {
  const list = document.getElementById("conversationList");
  list.innerHTML = "";

  const filtered = roomsCache.filter(function(room) {
    if (currentFilter === "all") return true;
    return room.type === currentFilter;
  });

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-conversation";

    const title = document.createElement("h3");
    title.textContent = "Belum ada percakapan";

    const info = document.createElement("p");
    info.textContent = "Buat ruang chat atau gabung menggunakan kode undangan.";

    empty.append(title, info);
    list.appendChild(empty);
    return;
  }

  filtered.forEach(function(room) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "menu-card";

    const title = document.createElement("strong");
    title.textContent = "Chat Pribadi";

    const detail = document.createElement("small");
    detail.textContent = "Kode: " + room.id.slice(0, 8);

    const content = document.createElement("span");
    content.append(title, detail);

    button.appendChild(content);

    button.addEventListener("click", function() {
      openRoom(room.id);
    });

    list.appendChild(button);
  });
}

// BUAT RUANG CHAT PRIBADI
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

    openRoom(roomId);

    alert(
      "Ruang berhasil dibuat!\n\n" +
      "Kode undangan:\n" + roomId +
      "\n\nBagikan kode ini kepada teman yang ingin diajak chat."
    );

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

// MENU CHAT PRIBADI
document.getElementById("openPrivateChat")
  .addEventListener("click", function() {
    const pilihan = prompt(
      "CHAT PRIBADI\n\n" +
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

// TOMBOL UNDANG
document.getElementById("inviteButton")
  .addEventListener("click", createPrivateRoom);

// MENU GRUP
document.getElementById("openGroupChat")
  .addEventListener("click", function() {
    alert("Fitur grup akan kita bangun setelah chat pribadi selesai.");
  });

// BUKA RUANG DAN DENGARKAN PESAN
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

        const bubble = document.createElement("div");

        bubble.className =
          "message-bubble " +
          (data.senderId === currentUser.uid ? "sent" : "received");

        bubble.textContent = data.text || "";

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

// KIRIM PESAN ONLINE
chatForm.addEventListener("submit", async function(event) {
  event.preventDefault();

  const text = chatInput.value.trim();

  if (!text || !currentUser || !currentRoomId) return;

  try {
    chatInput.value = "";

    await addDoc(
      collection(db, "rooms", currentRoomId, "messages"),
      {
        senderId: currentUser.uid,
        text: text,
        createdAt: serverTimestamp()
      }
    );

  } catch (error) {
    console.error(error);
    chatInput.value = text;
    alert("Pesan gagal dikirim: " + error.message);
  }
});

// KEMBALI KE BERANDA
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

handleMedia("photoInput", "foto");
handleMedia("videoInput", "video");

