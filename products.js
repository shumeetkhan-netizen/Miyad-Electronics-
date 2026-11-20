/*
  MIYAD Electronics Shop — Product catalogue
  নতুন পণ্য যোগ/দাম/ছবি/কালার পরিবর্তন করতে এই ফাইলটি edit করুন।
  ছবি images ফোল্ডারে রাখুন, যেমন: "images/my-product.jpg"
  image-এ সেই ফাইলের path লিখুন।
*/
const PRODUCTS = [
  {
    id: "led-20w",
    name: "MIYAD 20W LED Light",
    model: "MY-LED-20",
    category: "LED Light",
    price: 250,
    colors: ["Cool White", "Warm White", "Blue"],
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=85",
    description: "দৈনন্দিন ব্যবহারের জন্য LED লাইট"
  },
  {
    id: "led-bulb",
    name: "LED Bulb 12W",
    model: "MY-BULB-12",
    category: "LED Light",
    price: 150,
    colors: ["Cool White", "Warm White"],
    image: "https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=700&q=85",
    description: "এনার্জি সেভিং LED বাল্ব"
  },
  {
    id: "charger-25w",
    name: "Fast Charger 25W",
    model: "MC-25W",
    category: "Charger",
    price: 450,
    colors: ["White", "Black"],
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=85",
    description: "কমপ্যাক্ট ফাস্ট চার্জার"
  },
  {
    id: "cable-typec",
    name: "Type-C Charging Cable",
    model: "CB-TC-01",
    category: "Mobile Accessories",
    price: 120,
    colors: ["Black", "White"],
    image: "https://images.unsplash.com/photo-1615526675159-e248c3021d3f?auto=format&fit=crop&w=700&q=85",
    description: "দৈনন্দিন ব্যবহারের Type-C কেবল"
  },
  {
    id: "earbuds",
    name: "Wireless Earbuds",
    model: "MY-EAR-02",
    category: "Headphone",
    price: 850,
    colors: ["Black", "White"],
    image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=700&q=85",
    description: "ওয়্যারলেস অডিও এক্সপেরিয়েন্স"
  },
  {
    id: "headphone",
    name: "Stereo Headphone",
    model: "MY-HP-10",
    category: "Headphone",
    price: 650,
    colors: ["Black", "Blue"],
    image: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=700&q=85",
    description: "আরামদায়ক ওভার-ইয়ার হেডফোন"
  },
  {
    id: "powerbank",
    name: "Portable Power Bank",
    model: "MY-PB-10",
    category: "Mobile Accessories",
    price: 1200,
    colors: ["Black", "White"],
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=700&q=85",
    description: "ভ্রমণ ও দৈনন্দিন ব্যবহারের জন্য"
  },
  {
    id: "smart-device",
    name: "Smart Electronics Gadget",
    model: "MY-GAD-01",
    category: "অন্যান্য ইলেকট্রনিক্স",
    price: 990,
    colors: ["Black"],
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=85",
    description: "প্রয়োজনীয় ইলেকট্রনিক্স গ্যাজেট"
  }
];
