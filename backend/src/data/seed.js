const now = new Date().toISOString();

export const seedState = {
  customers: [
    {
      id: 1,
      firstName: "Ana",
      lastName: "Silva",
      email: "ana@sportsclub.pt",
      phone: "912345678",
      postalCode: "1000-001",
      passwordHash: "$2a$10$2uNTOwNwWcCQfM9ApdLwbe2IhL9Ck6mVJv2mCcKzT9ixMPrwHD9X2",
      role: "customer",
      createdAt: now
    }
  ],
  categories: [
    {
      id: 1,
      name: "Corrida",
      slug: "corrida",
      description: "Sapatilhas, t-shirts técnicas e acessórios para ganhar ritmo.",
      subcategories: ["Sapatilhas", "T-shirts técnicas", "Relógios GPS"]
    },
    {
      id: 2,
      name: "Fitness",
      slug: "fitness",
      description: "Treino funcional, força e mobilidade para casa ou ginásio.",
      subcategories: ["Halteres", "Tapetes", "Bandas elásticas"]
    },
    {
      id: 3,
      name: "Futebol",
      slug: "futebol",
      description: "Equipamento para treino, jogo e preparação de equipas.",
      subcategories: ["Bolas", "Chuteiras", "Cones e coletes"]
    },
    {
      id: 4,
      name: "Outdoor",
      slug: "outdoor",
      description: "Camadas, mochilas e material para aventura e trilho.",
      subcategories: ["Mochilas", "Casacos", "Lanternas"]
    },
    {
      id: 5,
      name: "Ciclismo",
      slug: "ciclismo",
      description: "Capacetes, iluminação e acessórios para estrada e cidade.",
      subcategories: ["Capacetes", "Luzes", "Luvas"]
    }
  ],
  campaigns: [
    {
      id: 1,
      name: "Season Kickoff",
      slug: "season-kickoff",
      description: "Seleção de lançamento para treino, corrida e preparação da nova época.",
      badge: "-20%",
      bannerTitle: "Arranca a época com equipamento novo",
      bannerCopy: "Modelos de corrida, treino indoor e outdoor com foco em performance e velocidade de compra.",
      active: true
    },
    {
      id: 2,
      name: "Team Picks",
      slug: "team-picks",
      description: "Essenciais para equipas, sessões de grupo e treino técnico.",
      badge: "Equipa",
      bannerTitle: "Tudo para sessões intensas de grupo",
      bannerCopy: "Bolas, chuteiras e acessórios para quem treina, compete e repete.",
      active: true
    }
  ],
  products: [
    {
      id: 1,
      sku: "RUN-001",
      name: "Sapatilhas Velocity Pro",
      slug: "sapatilhas-velocity-pro",
      description: "Amortecimento leve, resposta rápida e malha respirável para treinos diários.",
      price: 119.99,
      discountPrice: 99.99,
      unit: "par",
      stock: 24,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
      categoryId: 1,
      brand: "Apex Run",
      featured: true,
      campaignIds: [1],
      sizes: ["40", "41", "42", "43", "44"]
    },
    {
      id: 2,
      sku: "ODR-221",
      name: "Casaco Trail Shield",
      slug: "casaco-trail-shield",
      description: "Corta-vento leve com acabamento repelente à água para trilhos e deslocações.",
      price: 89.99,
      discountPrice: 74.99,
      unit: "un.",
      stock: 31,
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
      categoryId: 4,
      brand: "Summit Lab",
      featured: true,
      campaignIds: [1],
      sizes: ["S", "M", "L", "XL"]
    },
    {
      id: 3,
      sku: "FIT-105",
      name: "Tapete Core Mat 6 mm",
      slug: "tapete-core-mat-6mm",
      description: "Tapete antiderrapante para mobilidade, yoga e sessões de core.",
      price: 29.99,
      discountPrice: 24.99,
      unit: "un.",
      stock: 58,
      image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
      categoryId: 2,
      brand: "Studio Move",
      featured: true,
      campaignIds: [1],
      sizes: ["6 mm"]
    },
    {
      id: 4,
      sku: "FIT-210",
      name: "Halteres Hex 10 kg",
      slug: "halteres-hex-10kg",
      description: "Par de halteres revestidos com pega ergonómica para treino funcional.",
      price: 49.99,
      discountPrice: null,
      unit: "par",
      stock: 16,
      image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=900&q=80",
      categoryId: 2,
      brand: "Power Forge",
      featured: true,
      campaignIds: [],
      sizes: ["10 kg"]
    },
    {
      id: 5,
      sku: "FBL-301",
      name: "Bola Match Elite",
      slug: "bola-match-elite",
      description: "Construção texturada e voo estável para treino técnico e competição.",
      price: 34.99,
      discountPrice: 27.99,
      unit: "un.",
      stock: 42,
      image: "https://images.unsplash.com/photo-1614632537197-38a17061c2bd?auto=format&fit=crop&w=900&q=80",
      categoryId: 3,
      brand: "Club Field",
      featured: true,
      campaignIds: [2],
      sizes: ["5"]
    },
    {
      id: 6,
      sku: "FBL-455",
      name: "Chuteiras Sprint Turf",
      slug: "chuteiras-sprint-turf",
      description: "Tração agressiva para relva sintética e sessões de aceleração em espaço curto.",
      price: 79.99,
      discountPrice: 64.99,
      unit: "par",
      stock: 19,
      image: "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=900&q=80",
      categoryId: 3,
      brand: "Striker",
      featured: false,
      campaignIds: [2],
      sizes: ["39", "40", "41", "42", "43"]
    },
    {
      id: 7,
      sku: "ODR-510",
      name: "Mochila Summit Pack 25L",
      slug: "mochila-summit-pack-25l",
      description: "Compartimentação inteligente e ajuste anatómico para saídas de um dia.",
      price: 69.99,
      discountPrice: 54.99,
      unit: "un.",
      stock: 27,
      image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
      categoryId: 4,
      brand: "Summit Lab",
      featured: false,
      campaignIds: [1],
      sizes: ["25 L"]
    },
    {
      id: 8,
      sku: "CYC-112",
      name: "Capacete Aero Safe",
      slug: "capacete-aero-safe",
      description: "Ventilação equilibrada e ajuste micrométrico para voltas urbanas e treino.",
      price: 59.99,
      discountPrice: null,
      unit: "un.",
      stock: 21,
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80",
      categoryId: 5,
      brand: "Road Pulse",
      featured: true,
      campaignIds: [],
      sizes: ["M", "L"]
    }
  ],
  orders: [],
  invoices: []
};
