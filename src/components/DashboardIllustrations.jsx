import React from 'react';

// Left banner illustration: Fresh food basket / bowl with ingredients
export function FreshProduceBasketIllustration({ className = "w-28 h-24" }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="basketGrad" x1="20" y1="50" x2="140" y2="110" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F1F5F9" />
          <stop offset="1" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id="blueAccent" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="greenFresh" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#4ADE80" />
          <stop offset="1" stopColor="#16A34A" />
        </linearGradient>
        <linearGradient id="tomatoRed" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#F87171" />
          <stop offset="1" stopColor="#DC2626" />
        </linearGradient>
        <linearGradient id="goldEgg" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#FDE047" />
          <stop offset="1" stopColor="#EAB308" />
        </linearGradient>
      </defs>

      {/* Background soft glow */}
      <circle cx="80" cy="65" r="50" fill="#EFF6FF" />

      {/* Eggs in carton / basket */}
      <ellipse cx="48" cy="45" rx="8" ry="11" fill="url(#goldEgg)" transform="rotate(-15 48 45)" />
      <ellipse cx="62" cy="42" rx="8" ry="11" fill="#FEF08A" transform="rotate(5 62 42)" />
      <ellipse cx="76" cy="45" rx="8" ry="11" fill="url(#goldEgg)" transform="rotate(20 76 45)" />

      {/* Bread & Bakery */}
      <rect x="25" y="52" width="40" height="18" rx="8" fill="#FBBF24" transform="rotate(-20 25 52)" />
      <path d="M22 62 C26 58 35 56 42 58" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />

      {/* Fresh Vegetables / Spinach / Broccoli */}
      <circle cx="95" cy="40" r="14" fill="url(#greenFresh)" />
      <circle cx="112" cy="46" r="12" fill="#22C55E" />
      <circle cx="104" cy="32" r="11" fill="#15803D" />
      {/* Leaves */}
      <path d="M88 35 Q92 20 102 24 Q106 36 94 38 Z" fill="#86EFAC" />

      {/* Tomato / Berries */}
      <circle cx="70" cy="58" r="9" fill="url(#tomatoRed)" />
      <circle cx="85" cy="56" r="8" fill="#EF4444" />
      <circle cx="78" cy="66" r="7" fill="url(#tomatoRed)" />
      {/* Tomato stem */}
      <path d="M70 49 L72 52 M68 51 L71 52 M73 50 L70 52" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" />

      {/* Milk / Oil bottle */}
      <rect x="118" y="32" width="16" height="36" rx="4" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="2" />
      <rect x="122" y="24" width="8" height="8" rx="2" fill="url(#blueAccent)" />
      <rect x="120" y="44" width="12" height="12" rx="2" fill="#DBEAFE" />

      {/* Front Basket / Bag contour */}
      <path d="M20 75 Q18 105 45 108 L115 108 Q142 105 140 75 Z" fill="url(#basketGrad)" stroke="#CBD5E1" strokeWidth="2" />
      <path d="M30 82 Q80 94 130 82" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" opacity="0.6" />
      <path d="M35 94 Q80 104 125 94" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

// Right banner illustration: Kraft eco grocery shopping bag filled with baguettes and veggies
export function GroceryBagIllustration({ className = "w-28 h-28" }) {
  return (
    <svg viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="kraftBag" x1="30" y1="45" x2="110" y2="135" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E2E8F0" />
          <stop offset="1" stopColor="#CBD5E1" />
        </linearGradient>
        <linearGradient id="baguetteGrad" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#FCD34D" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* Baguette stick sticking out */}
      <rect x="80" y="10" width="18" height="65" rx="9" fill="url(#baguetteGrad)" transform="rotate(22 80 10)" stroke="#B45309" strokeWidth="1" />
      <line x1="88" y1="25" x2="98" y2="29" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
      <line x1="84" y1="36" x2="94" y2="40" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
      <line x1="80" y1="48" x2="90" y2="52" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />

      {/* Greens & Leek */}
      <path d="M42 35 C38 18 52 14 56 26 C60 14 74 18 70 34 Z" fill="#22C55E" />
      <path d="M48 28 L50 48 M62 26 L60 48" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" />

      {/* Bottle sticking out */}
      <rect x="28" y="24" width="14" height="32" rx="3" fill="#38BDF8" opacity="0.9" />
      <rect x="31" y="17" width="8" height="7" rx="1.5" fill="#0284C7" />

      {/* Red apple / pepper */}
      <circle cx="70" cy="48" r="10" fill="#EF4444" />
      <path d="M70 38 Q74 34 76 36" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />

      {/* Paper Bag Body */}
      <path d="M22 52 L30 130 H110 L118 52 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
      
      {/* Fold lines of the paper bag */}
      <path d="M22 52 L36 62 H104 L118 52" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
      <line x1="42" y1="62" x2="48" y2="130" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="98" y1="62" x2="92" y2="130" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" />

      {/* Blue StockPilot Badge / Handle on bag */}
      <path d="M54 75 Q50 95 62 98 Q70 100 70 82" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M86 75 Q90 95 78 98 Q70 100 70 82" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* Elegant minimalist StockPilot leaf / pilot logo on bag */}
      <circle cx="70" cy="112" r="8" fill="#DBEAFE" />
      <path d="M68 114 L72 110 M72 114 L68 110" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Bottom left filter illustration: Factory conveyor belt / assembly line with boxes & robotic arm
export function ConveyorBeltIllustration({ className = "w-full h-32" }) {
  return (
    <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="armBlue" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="beltGrad" x1="10" y1="80" x2="190" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#334155" />
          <stop offset="1" stopColor="#1E293B" />
        </linearGradient>
        <linearGradient id="boxGrad" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#93C5FD" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="boxGold" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#FDE68A" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      {/* Floor reflection / shadow */}
      <ellipse cx="100" cy="116" rx="90" ry="12" fill="#E2E8F0" opacity="0.6" />

      {/* Conveyor legs */}
      <rect x="35" y="85" width="6" height="28" rx="2" fill="#64748B" />
      <rect x="95" y="88" width="6" height="25" rx="2" fill="#64748B" />
      <rect x="155" y="85" width="6" height="28" rx="2" fill="#64748B" />
      <line x1="38" y1="102" x2="158" y2="102" stroke="#94A3B8" strokeWidth="2" />

      {/* Conveyor Main Track */}
      <path d="M15 82 C15 78 20 74 26 74 L174 74 C180 74 185 78 185 82 C185 86 180 90 174 90 L26 90 C20 90 15 86 15 82 Z" fill="url(#beltGrad)" />
      
      {/* Belt rollers / lines */}
      <line x1="40" y1="76" x2="38" y2="88" stroke="#64748B" strokeWidth="2" />
      <line x1="65" y1="76" x2="63" y2="88" stroke="#64748B" strokeWidth="2" />
      <line x1="90" y1="76" x2="88" y2="88" stroke="#64748B" strokeWidth="2" />
      <line x1="115" y1="76" x2="113" y2="88" stroke="#64748B" strokeWidth="2" />
      <line x1="140" y1="76" x2="138" y2="88" stroke="#64748B" strokeWidth="2" />
      <line x1="165" y1="76" x2="163" y2="88" stroke="#64748B" strokeWidth="2" />

      {/* Package 1: Blue box */}
      <g transform="translate(30, 52)">
        <rect x="0" y="0" width="22" height="20" rx="3" fill="url(#boxGrad)" stroke="#1D4ED8" strokeWidth="1" />
        <line x1="11" y1="0" x2="11" y2="20" stroke="#DBEAFE" strokeWidth="1.5" />
        <line x1="0" y1="10" x2="22" y2="10" stroke="#DBEAFE" strokeWidth="1.5" />
      </g>

      {/* Package 2: Gold/Kraft box under robot */}
      <g transform="translate(85, 48)">
        <rect x="0" y="0" width="26" height="24" rx="3" fill="url(#boxGold)" stroke="#D97706" strokeWidth="1" />
        <line x1="13" y1="0" x2="13" y2="24" stroke="#FEF3C7" strokeWidth="2" />
        <line x1="0" y1="12" x2="26" y2="12" stroke="#FEF3C7" strokeWidth="2" />
        <rect x="18" y="3" width="5" height="6" rx="1" fill="#FFFFFF" opacity="0.8" />
      </g>

      {/* Package 3: Green food box */}
      <g transform="translate(142, 54)">
        <rect x="0" y="0" width="20" height="18" rx="3" fill="#10B981" stroke="#047857" strokeWidth="1" />
        <line x1="10" y1="0" x2="10" y2="18" stroke="#A7F3D0" strokeWidth="1.5" />
      </g>

      {/* Robotic Arm Base on top */}
      <rect x="90" y="4" width="18" height="8" rx="2" fill="#1E293B" />
      <circle cx="99" cy="12" r="5" fill="url(#armBlue)" />
      
      {/* Arm segments */}
      <line x1="99" y1="12" x2="115" y2="28" stroke="#0284C7" strokeWidth="5" strokeLinecap="round" />
      <circle cx="115" cy="28" r="4" fill="#38BDF8" />
      <line x1="115" y1="28" x2="98" y2="44" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />
      
      {/* Gripper / Suction cup */}
      <path d="M92 44 H104 M94 44 V47 M102 44 V47" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
      {/* Laser scan line */}
      <line x1="92" y1="48" x2="104" y2="48" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="2 1" />

      {/* Mini Worker / Operator silhouette with hardhat */}
      <circle cx="180" cy="52" r="4.5" fill="#3B82F6" />
      <ellipse cx="180" cy="50" rx="5.5" ry="2.5" fill="#F59E0B" /> {/* Yellow hard hat */}
      <path d="M174 68 C174 60 186 60 186 68 Z" fill="#2563EB" />
    </svg>
  );
}
