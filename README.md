# Sayem Sifat — Portfolio (Static HTML)

AI Automation Engineer & maker of **Leadloop Extension**। এটা পুরোপুরি স্ট্যাটিক সাইট (HTML + CSS + JS)। কোনো সার্ভার বা বিল্ড ছাড়াই চলে।

## GitHub Pages-এ লাইভ করার নিয়ম (ফ্রি)

1. GitHub-এ নতুন repository বানাও (যেমন `portfolio`)।
2. এই ফোল্ডারের **সব ফাইল** (`index.html`, `assets`, `projects`, `receipts`, `role`, `.nojekyll` সহ) repository-র root-এ আপলোড/পুশ করো:
   ```bash
   git init
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/<তোমার-ইউজারনেম>/portfolio.git
   git push -u origin main
   ```
3. Repository → **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **main** / folder: **/(root)** → **Save**
4. ১–২ মিনিট পর সাইট চালু হবে: `https://<তোমার-ইউজারনেম>.github.io/portfolio/`

> সব লিংক relative, তাই repository-র নাম যা-ই হোক সাইট ঠিকভাবে চলবে। কাস্টম ডোমেইনও যোগ করা যায় (Settings → Pages → Custom domain)।

## ফোল্ডার কাঠামো

```
index.html              হোম পেজ
projects/index.html     সব প্রজেক্টের লিস্ট
projects/<slug>/        প্রতিটা প্রজেক্টের ডিটেইল পেজ (২০টা)
receipts/  role/        Receipts ও Role পেজ
assets/css/style.css    কম্পাইল করা বেস স্টাইল
assets/css/premium.css  প্রিমিয়াম UI লেয়ার (রঙ, কার্ড, বাটন, হিরো ওয়ার্কফ্লো)
assets/js/main.js       সব অ্যানিমেশন ও ইন্টারঅ্যাকশন
assets/images/          ছবি ও ফেভিকন
_source/                জেনারেটর (কনটেন্ট বদলাতে চাইলে)
```

## কনটেন্ট (লেখা, নম্বর, প্রজেক্ট) বদলানোর নিয়ম

লেখা/প্রজেক্ট `_source/build.mjs` ও `_source/data/projects.json`-এ আছে। বদলে নিচের কমান্ড চালালে সব পেজ নতুন করে তৈরি হবে (Node.js 18+ লাগবে):

```bash
cd _source
node build.mjs        # শুধু HTML তৈরি হয়, ইন্টারনেট বা npm install লাগে না
```

ছোট কোনো লেখা বদলাতে চাইলে সরাসরি `.html` ফাইলেও এডিট করতে পারো, তবে পরে `npm run build` চালালে ওই এডিট মুছে যাবে।

## ইউটিলিটি

- **থিম**: ফ্লোটিং বাটনে লাইট/ডার্ক টগল, পছন্দ মনে রাখে
- **ভিডিও**: `build.mjs`-এ `oEEKHK-aCCE` হলো YouTube ভিডিও আইডি, ওটা বদলালেই নতুন ভিডিও
- **অ্যানিমেশন বন্ধ**: ডিভাইসে "Reduce motion" অন থাকলে অ্যানিমেশন অটো বন্ধ থাকে
