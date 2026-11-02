// Gerado por tools/anim_pack.py (Blender). Não edite à mão.
// Quadro quadrado de `cell` px cobrindo 1,6x o sprite (`px`); base do sprite a 12,5% da altura,
// a partir de baixo, centralizada. Monstros olham para a esquerda. `impact` = quadro do golpe.
// Entradas com `fx: true` (água, cardume, fumaça) não seguem essa geometria: o quadro cobre
// `tiles` tiles e `anchor` diz onde alinhar.
window.ANIM_META = { margin: 1.6, ground: 0.125 };
window.ANIM_SHEETS = {
 "slime": {
  "src": "assets/flow/anim/slime_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   }
  }
 },
 "mob_slime_blue": {
  "src": "assets/flow/anim/mob_slime_blue_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   }
  }
 },
 "mob_slime_crystal": {
  "src": "assets/flow/anim/mob_slime_crystal_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "special": {
    "row": 5,
    "frames": 8,
    "fps": 8,
    "loop": false,
    "impact": 6
   },
   "rise_up": {
    "row": 6,
    "frames": 6,
    "fps": 10,
    "loop": false
   }
  }
 },
 "mob_boar": {
  "src": "assets/flow/anim/mob_boar_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   }
  }
 },
 "mob_wolf": {
  "src": "assets/flow/anim/mob_wolf_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "sleep": {
    "row": 5,
    "frames": 8,
    "fps": 4,
    "loop": true
   },
   "wake": {
    "row": 6,
    "frames": 4,
    "fps": 8,
    "loop": false
   }
  }
 },
 "mob_wolf_alpha": {
  "src": "assets/flow/anim/mob_wolf_alpha_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "howl": {
    "row": 5,
    "frames": 8,
    "fps": 8,
    "loop": false
   }
  }
 },
 "mob_goblin": {
  "src": "assets/flow/anim/mob_goblin_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   }
  }
 },
 "mob_skeleton": {
  "src": "assets/flow/anim/mob_skeleton_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "rise_up": {
    "row": 5,
    "frames": 6,
    "fps": 10,
    "loop": false
   }
  }
 },
 "mob_boss_ruins": {
  "src": "assets/flow/anim/mob_boss_ruins_anim.png",
  "cell": 307,
  "px": 192,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "special": {
    "row": 5,
    "frames": 8,
    "fps": 8,
    "loop": false,
    "impact": 6
   },
   "enrage": {
    "row": 6,
    "frames": 6,
    "fps": 10,
    "loop": false
   }
  }
 },
 "mob_golem": {
  "src": "assets/flow/anim/mob_golem_anim.png",
  "cell": 307,
  "px": 192,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "special": {
    "row": 5,
    "frames": 8,
    "fps": 8,
    "loop": false,
    "impact": 6
   },
   "rise_up": {
    "row": 6,
    "frames": 6,
    "fps": 10,
    "loop": false
   }
  }
 },
 "mob_boss_golem": {
  "src": "assets/flow/anim/mob_boss_golem_anim.png",
  "cell": 307,
  "px": 192,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "special": {
    "row": 5,
    "frames": 8,
    "fps": 8,
    "loop": false,
    "impact": 6
   }
  }
 },
 "mob_crypt_guardian": {
  "src": "assets/flow/anim/mob_crypt_guardian_anim.png",
  "cell": 307,
  "px": 192,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "rise_up": {
    "row": 5,
    "frames": 6,
    "fps": 10,
    "loop": false
   }
  }
 },
 "mob_lumita_colossus": {
  "src": "assets/flow/anim/mob_lumita_colossus_anim.png",
  "cell": 307,
  "px": 192,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "special": {
    "row": 5,
    "frames": 8,
    "fps": 8,
    "loop": false,
    "impact": 6
   }
  }
 },
 "mob_wolf_moon": {
  "src": "assets/flow/anim/mob_wolf_moon_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "howl": {
    "row": 5,
    "frames": 8,
    "fps": 8,
    "loop": false
   }
  }
 },
 "mob_goblin_boss": {
  "src": "assets/flow/anim/mob_goblin_boss_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   }
  }
 },
 "mob_quartz_spider": {
  "src": "assets/flow/anim/mob_quartz_spider_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   }
  }
 },
 "mob_crystal_sentinel": {
  "src": "assets/flow/anim/mob_crystal_sentinel_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "special": {
    "row": 5,
    "frames": 8,
    "fps": 8,
    "loop": false,
    "impact": 6
   }
  }
 },
 "mob_light_wraith": {
  "src": "assets/flow/anim/mob_light_wraith_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   }
  }
 },
 "mob_boss_serpent": {
  "src": "assets/flow/anim/mob_boss_serpent_anim.png",
  "cell": 410,
  "px": 256,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "special": {
    "row": 5,
    "frames": 8,
    "fps": 8,
    "loop": false,
    "impact": 6
   }
  }
 },
 "mob_boss_serpent_echo": {
  "src": "assets/flow/anim/mob_boss_serpent_echo_anim.png",
  "cell": 410,
  "px": 256,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "special": {
    "row": 5,
    "frames": 8,
    "fps": 8,
    "loop": false,
    "impact": 6
   }
  }
 },
 "pet_moon_1": {
  "src": "assets/flow/anim/pet_moon_1_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "sleep": {
    "row": 5,
    "frames": 8,
    "fps": 4,
    "loop": true
   }
  }
 },
 "pet_moon_2": {
  "src": "assets/flow/anim/pet_moon_2_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "sleep": {
    "row": 5,
    "frames": 8,
    "fps": 4,
    "loop": true
   }
  }
 },
 "pet_moon_3": {
  "src": "assets/flow/anim/pet_moon_3_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "walk": {
    "row": 1,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "attack": {
    "row": 2,
    "frames": 8,
    "fps": 14,
    "loop": false,
    "impact": 4
   },
   "hit": {
    "row": 3,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death": {
    "row": 4,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "sleep": {
    "row": 5,
    "frames": 8,
    "fps": 4,
    "loop": true
   }
  }
 },
 "deco_dummy": {
  "src": "assets/flow/anim/deco_dummy_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "wobble": {
    "row": 0,
    "frames": 6,
    "fps": 14,
    "loop": false
   },
   "swing": {
    "row": 1,
    "frames": 8,
    "fps": 14,
    "loop": false
   }
  }
 },
 "tree": {
  "src": "assets/flow/anim/tree_anim.png",
  "cell": 256,
  "px": 160,
  "rows": {
   "sway": {
    "row": 0,
    "frames": 16,
    "fps": 6,
    "loop": true
   }
  }
 },
 "tree_oak": {
  "src": "assets/flow/anim/tree_oak_anim.png",
  "cell": 256,
  "px": 160,
  "rows": {
   "sway": {
    "row": 0,
    "frames": 16,
    "fps": 6,
    "loop": true
   }
  }
 },
 "tree_cedar": {
  "src": "assets/flow/anim/tree_cedar_anim.png",
  "cell": 256,
  "px": 160,
  "rows": {
   "sway": {
    "row": 0,
    "frames": 16,
    "fps": 6,
    "loop": true
   }
  }
 },
 "deco_bush": {
  "src": "assets/flow/anim/deco_bush_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "sway": {
    "row": 0,
    "frames": 16,
    "fps": 6,
    "loop": true
   }
  }
 },
 "deco_flowers": {
  "src": "assets/flow/anim/deco_flowers_anim.png",
  "cell": 102,
  "px": 64,
  "rows": {
   "sway": {
    "row": 0,
    "frames": 16,
    "fps": 6,
    "loop": true
   }
  }
 },
 "campfire": {
  "src": "assets/flow/anim/campfire_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "flicker": {
    "row": 0,
    "frames": 8,
    "fps": 10,
    "loop": true
   }
  }
 },
 "deco_brazier": {
  "src": "assets/flow/anim/deco_brazier_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "flicker": {
    "row": 0,
    "frames": 8,
    "fps": 10,
    "loop": true
   }
  }
 },
 "deco_den_torch": {
  "src": "assets/flow/anim/deco_den_torch_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "flicker": {
    "row": 0,
    "frames": 8,
    "fps": 10,
    "loop": true
   }
  }
 },
 "rock": {
  "src": "assets/flow/anim/rock_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "hit": {
    "row": 0,
    "frames": 4,
    "fps": 14,
    "loop": false
   }
  }
 },
 "rock_iron": {
  "src": "assets/flow/anim/rock_iron_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "hit": {
    "row": 0,
    "frames": 4,
    "fps": 14,
    "loop": false
   }
  }
 },
 "rock_lumita": {
  "src": "assets/flow/anim/rock_lumita_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "hit": {
    "row": 0,
    "frames": 4,
    "fps": 14,
    "loop": false
   }
  }
 },
 "npc_merchant": {
  "src": "assets/flow/anim/npc_merchant_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "talk": {
    "row": 1,
    "frames": 8,
    "fps": 8,
    "loop": true
   },
   "walk": {
    "row": 2,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "thumbs": {
    "row": 3,
    "frames": 6,
    "fps": 8,
    "loop": false,
    "hold": 5
   }
  }
 },
 "npc_guard": {
  "src": "assets/flow/anim/npc_guard_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "talk": {
    "row": 1,
    "frames": 8,
    "fps": 8,
    "loop": true
   },
   "walk": {
    "row": 2,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "salute": {
    "row": 3,
    "frames": 6,
    "fps": 8,
    "loop": false,
    "hold": 5
   }
  }
 },
 "npc_bard": {
  "src": "assets/flow/anim/npc_bard_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "talk": {
    "row": 1,
    "frames": 8,
    "fps": 8,
    "loop": true
   },
   "walk": {
    "row": 2,
    "frames": 8,
    "fps": 10,
    "loop": true
   },
   "play": {
    "row": 3,
    "frames": 8,
    "fps": 8,
    "loop": true
   },
   "sit": {
    "row": 4,
    "frames": 8,
    "fps": 8,
    "loop": true
   },
   "bow": {
    "row": 5,
    "frames": 6,
    "fps": 8,
    "loop": false,
    "hold": 5
   },
   "stand_up": {
    "row": 6,
    "frames": 4,
    "fps": 10,
    "loop": false
   }
  }
 },
 "npc_juna": {
  "src": "assets/flow/anim/npc_juna_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "talk": {
    "row": 1,
    "frames": 8,
    "fps": 8,
    "loop": true
   },
   "walk": {
    "row": 2,
    "frames": 8,
    "fps": 10,
    "loop": true
   }
  }
 },
 "npc_odilia": {
  "src": "assets/flow/anim/npc_odilia_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "talk": {
    "row": 1,
    "frames": 8,
    "fps": 8,
    "loop": true
   },
   "walk": {
    "row": 2,
    "frames": 8,
    "fps": 10,
    "loop": true
   }
  }
 },
 "npc_bras": {
  "src": "assets/flow/anim/npc_bras_anim.png",
  "cell": 205,
  "px": 128,
  "rows": {
   "idle": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "talk": {
    "row": 1,
    "frames": 8,
    "fps": 8,
    "loop": true
   },
   "walk": {
    "row": 2,
    "frames": 8,
    "fps": 10,
    "loop": true
   }
  }
 },
 "hero_1": {
  "src": "assets/flow/anim/hero_1_anim.png",
  "cell": 102,
  "px": 64,
  "rows": {
   "idle_down": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "idle_left": {
    "row": 1,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "idle_right": {
    "row": 2,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "idle_up": {
    "row": 3,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "hit_down": {
    "row": 4,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "hit_left": {
    "row": 5,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "hit_right": {
    "row": 6,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "hit_up": {
    "row": 7,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death_down": {
    "row": 8,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "death_left": {
    "row": 9,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "death_right": {
    "row": 10,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "death_up": {
    "row": 11,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "eat_down": {
    "row": 12,
    "frames": 4,
    "fps": 8,
    "loop": true
   },
   "eat_left": {
    "row": 13,
    "frames": 4,
    "fps": 8,
    "loop": true
   },
   "eat_right": {
    "row": 14,
    "frames": 4,
    "fps": 8,
    "loop": true
   },
   "eat_up": {
    "row": 15,
    "frames": 4,
    "fps": 8,
    "loop": true
   },
   "dash_down": {
    "row": 16,
    "frames": 3,
    "fps": 16,
    "loop": false
   },
   "dash_left": {
    "row": 17,
    "frames": 3,
    "fps": 16,
    "loop": false
   },
   "dash_right": {
    "row": 18,
    "frames": 3,
    "fps": 16,
    "loop": false
   },
   "dash_up": {
    "row": 19,
    "frames": 3,
    "fps": 16,
    "loop": false
   }
  }
 },
 "hero_2": {
  "src": "assets/flow/anim/hero_2_anim.png",
  "cell": 102,
  "px": 64,
  "rows": {
   "idle_down": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "idle_left": {
    "row": 1,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "idle_right": {
    "row": 2,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "idle_up": {
    "row": 3,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "hit_down": {
    "row": 4,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "hit_left": {
    "row": 5,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "hit_right": {
    "row": 6,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "hit_up": {
    "row": 7,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death_down": {
    "row": 8,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "death_left": {
    "row": 9,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "death_right": {
    "row": 10,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "death_up": {
    "row": 11,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "eat_down": {
    "row": 12,
    "frames": 4,
    "fps": 8,
    "loop": true
   },
   "eat_left": {
    "row": 13,
    "frames": 4,
    "fps": 8,
    "loop": true
   },
   "eat_right": {
    "row": 14,
    "frames": 4,
    "fps": 8,
    "loop": true
   },
   "eat_up": {
    "row": 15,
    "frames": 4,
    "fps": 8,
    "loop": true
   },
   "dash_down": {
    "row": 16,
    "frames": 3,
    "fps": 16,
    "loop": false
   },
   "dash_left": {
    "row": 17,
    "frames": 3,
    "fps": 16,
    "loop": false
   },
   "dash_right": {
    "row": 18,
    "frames": 3,
    "fps": 16,
    "loop": false
   },
   "dash_up": {
    "row": 19,
    "frames": 3,
    "fps": 16,
    "loop": false
   }
  }
 },
 "hero_3": {
  "src": "assets/flow/anim/hero_3_anim.png",
  "cell": 102,
  "px": 64,
  "rows": {
   "idle_down": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "idle_left": {
    "row": 1,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "idle_right": {
    "row": 2,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "idle_up": {
    "row": 3,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "hit_down": {
    "row": 4,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "hit_left": {
    "row": 5,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "hit_right": {
    "row": 6,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "hit_up": {
    "row": 7,
    "frames": 4,
    "fps": 14,
    "loop": false
   },
   "death_down": {
    "row": 8,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "death_left": {
    "row": 9,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "death_right": {
    "row": 10,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "death_up": {
    "row": 11,
    "frames": 8,
    "fps": 10,
    "loop": false
   },
   "eat_down": {
    "row": 12,
    "frames": 4,
    "fps": 8,
    "loop": true
   },
   "eat_left": {
    "row": 13,
    "frames": 4,
    "fps": 8,
    "loop": true
   },
   "eat_right": {
    "row": 14,
    "frames": 4,
    "fps": 8,
    "loop": true
   },
   "eat_up": {
    "row": 15,
    "frames": 4,
    "fps": 8,
    "loop": true
   },
   "dash_down": {
    "row": 16,
    "frames": 3,
    "fps": 16,
    "loop": false
   },
   "dash_left": {
    "row": 17,
    "frames": 3,
    "fps": 16,
    "loop": false
   },
   "dash_right": {
    "row": 18,
    "frames": 3,
    "fps": 16,
    "loop": false
   },
   "dash_up": {
    "row": 19,
    "frames": 3,
    "fps": 16,
    "loop": false
   }
  }
 },
 "hero_1_dash": {
  "src": "assets/flow/anim/hero_1_dash_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "dash_down": {
    "row": 0,
    "frames": 3,
    "fps": 16,
    "loop": false
   },
   "dash_left": {
    "row": 1,
    "frames": 3,
    "fps": 16,
    "loop": false
   },
   "dash_right": {
    "row": 2,
    "frames": 3,
    "fps": 16,
    "loop": false
   },
   "dash_up": {
    "row": 3,
    "frames": 3,
    "fps": 16,
    "loop": false
   }
  }
 },
 "hero_1_block": {
  "src": "assets/flow/anim/hero_1_block_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "block_down": {
    "row": 0,
    "frames": 3,
    "fps": 14,
    "loop": false
   },
   "block_left": {
    "row": 1,
    "frames": 3,
    "fps": 14,
    "loop": false
   },
   "block_right": {
    "row": 2,
    "frames": 3,
    "fps": 14,
    "loop": false
   },
   "block_up": {
    "row": 3,
    "frames": 3,
    "fps": 14,
    "loop": false
   }
  }
 },
 "hero_1_cancel": {
  "src": "assets/flow/anim/hero_1_cancel_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "cancel_down": {
    "row": 0,
    "frames": 2,
    "fps": 16,
    "loop": false
   },
   "cancel_left": {
    "row": 1,
    "frames": 2,
    "fps": 16,
    "loop": false
   },
   "cancel_right": {
    "row": 2,
    "frames": 2,
    "fps": 16,
    "loop": false
   },
   "cancel_up": {
    "row": 3,
    "frames": 2,
    "fps": 16,
    "loop": false
   }
  }
 },
 "hero_1_cheer": {
  "src": "assets/flow/anim/hero_1_cheer_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "cheer_down": {
    "row": 0,
    "frames": 4,
    "fps": 8,
    "loop": false
   },
   "cheer_left": {
    "row": 1,
    "frames": 4,
    "fps": 8,
    "loop": false
   },
   "cheer_right": {
    "row": 2,
    "frames": 4,
    "fps": 8,
    "loop": false
   },
   "cheer_up": {
    "row": 3,
    "frames": 4,
    "fps": 8,
    "loop": false
   },
   "cheer_walk_down": {
    "row": 4,
    "frames": 2,
    "fps": 8,
    "loop": true
   },
   "cheer_walk_left": {
    "row": 5,
    "frames": 2,
    "fps": 8,
    "loop": true
   },
   "cheer_walk_right": {
    "row": 6,
    "frames": 2,
    "fps": 8,
    "loop": true
   },
   "cheer_walk_up": {
    "row": 7,
    "frames": 2,
    "fps": 8,
    "loop": true
   }
  }
 },
 "hero_1_strike4": {
  "src": "assets/flow/anim/hero_1_strike4_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "strike_down": {
    "row": 0,
    "frames": 4,
    "fps": 16,
    "loop": false,
    "impact": 2
   },
   "strike_up": {
    "row": 1,
    "frames": 4,
    "fps": 16,
    "loop": false,
    "impact": 2
   }
  }
 },
 "hero_2_dash": {
  "src": "assets/flow/anim/hero_2_dash_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "dash_down": {
    "row": 0,
    "frames": 3,
    "fps": 16,
    "loop": false
   },
   "dash_left": {
    "row": 1,
    "frames": 3,
    "fps": 16,
    "loop": false
   },
   "dash_right": {
    "row": 2,
    "frames": 3,
    "fps": 16,
    "loop": false
   },
   "dash_up": {
    "row": 3,
    "frames": 3,
    "fps": 16,
    "loop": false
   }
  }
 },
 "hero_2_block": {
  "src": "assets/flow/anim/hero_2_block_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "block_down": {
    "row": 0,
    "frames": 3,
    "fps": 14,
    "loop": false
   },
   "block_left": {
    "row": 1,
    "frames": 3,
    "fps": 14,
    "loop": false
   },
   "block_right": {
    "row": 2,
    "frames": 3,
    "fps": 14,
    "loop": false
   },
   "block_up": {
    "row": 3,
    "frames": 3,
    "fps": 14,
    "loop": false
   }
  }
 },
 "hero_2_cancel": {
  "src": "assets/flow/anim/hero_2_cancel_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "cancel_down": {
    "row": 0,
    "frames": 2,
    "fps": 16,
    "loop": false
   },
   "cancel_left": {
    "row": 1,
    "frames": 2,
    "fps": 16,
    "loop": false
   },
   "cancel_right": {
    "row": 2,
    "frames": 2,
    "fps": 16,
    "loop": false
   },
   "cancel_up": {
    "row": 3,
    "frames": 2,
    "fps": 16,
    "loop": false
   }
  }
 },
 "hero_2_cheer": {
  "src": "assets/flow/anim/hero_2_cheer_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "cheer_down": {
    "row": 0,
    "frames": 4,
    "fps": 8,
    "loop": false
   },
   "cheer_left": {
    "row": 1,
    "frames": 4,
    "fps": 8,
    "loop": false
   },
   "cheer_right": {
    "row": 2,
    "frames": 4,
    "fps": 8,
    "loop": false
   },
   "cheer_up": {
    "row": 3,
    "frames": 4,
    "fps": 8,
    "loop": false
   },
   "cheer_walk_down": {
    "row": 4,
    "frames": 2,
    "fps": 8,
    "loop": true
   },
   "cheer_walk_left": {
    "row": 5,
    "frames": 2,
    "fps": 8,
    "loop": true
   },
   "cheer_walk_right": {
    "row": 6,
    "frames": 2,
    "fps": 8,
    "loop": true
   },
   "cheer_walk_up": {
    "row": 7,
    "frames": 2,
    "fps": 8,
    "loop": true
   }
  }
 },
 "hero_2_strike4": {
  "src": "assets/flow/anim/hero_2_strike4_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "strike_down": {
    "row": 0,
    "frames": 4,
    "fps": 16,
    "loop": false,
    "impact": 2
   },
   "strike_up": {
    "row": 1,
    "frames": 4,
    "fps": 16,
    "loop": false,
    "impact": 2
   }
  }
 },
 "hero_3_dash": {
  "src": "assets/flow/anim/hero_3_dash_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "dash_down": {
    "row": 0,
    "frames": 3,
    "fps": 16,
    "loop": false
   },
   "dash_left": {
    "row": 1,
    "frames": 3,
    "fps": 16,
    "loop": false
   },
   "dash_right": {
    "row": 2,
    "frames": 3,
    "fps": 16,
    "loop": false
   },
   "dash_up": {
    "row": 3,
    "frames": 3,
    "fps": 16,
    "loop": false
   }
  }
 },
 "hero_3_block": {
  "src": "assets/flow/anim/hero_3_block_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "block_down": {
    "row": 0,
    "frames": 3,
    "fps": 14,
    "loop": false
   },
   "block_left": {
    "row": 1,
    "frames": 3,
    "fps": 14,
    "loop": false
   },
   "block_right": {
    "row": 2,
    "frames": 3,
    "fps": 14,
    "loop": false
   },
   "block_up": {
    "row": 3,
    "frames": 3,
    "fps": 14,
    "loop": false
   }
  }
 },
 "hero_3_cancel": {
  "src": "assets/flow/anim/hero_3_cancel_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "cancel_down": {
    "row": 0,
    "frames": 2,
    "fps": 16,
    "loop": false
   },
   "cancel_left": {
    "row": 1,
    "frames": 2,
    "fps": 16,
    "loop": false
   },
   "cancel_right": {
    "row": 2,
    "frames": 2,
    "fps": 16,
    "loop": false
   },
   "cancel_up": {
    "row": 3,
    "frames": 2,
    "fps": 16,
    "loop": false
   }
  }
 },
 "hero_3_cheer": {
  "src": "assets/flow/anim/hero_3_cheer_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "cheer_down": {
    "row": 0,
    "frames": 4,
    "fps": 8,
    "loop": false
   },
   "cheer_left": {
    "row": 1,
    "frames": 4,
    "fps": 8,
    "loop": false
   },
   "cheer_right": {
    "row": 2,
    "frames": 4,
    "fps": 8,
    "loop": false
   },
   "cheer_up": {
    "row": 3,
    "frames": 4,
    "fps": 8,
    "loop": false
   },
   "cheer_walk_down": {
    "row": 4,
    "frames": 2,
    "fps": 8,
    "loop": true
   },
   "cheer_walk_left": {
    "row": 5,
    "frames": 2,
    "fps": 8,
    "loop": true
   },
   "cheer_walk_right": {
    "row": 6,
    "frames": 2,
    "fps": 8,
    "loop": true
   },
   "cheer_walk_up": {
    "row": 7,
    "frames": 2,
    "fps": 8,
    "loop": true
   }
  }
 },
 "hero_3_strike4": {
  "src": "assets/flow/anim/hero_3_strike4_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "strike_down": {
    "row": 0,
    "frames": 4,
    "fps": 16,
    "loop": false,
    "impact": 2
   },
   "strike_up": {
    "row": 1,
    "frames": 4,
    "fps": 16,
    "loop": false,
    "impact": 2
   }
  }
 },
 "npc_merchant_look": {
  "src": "assets/flow/anim/npc_merchant_look_anim.png",
  "cell": 102,
  "px": 64,
  "rows": {
   "idle_left": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "idle_right": {
    "row": 1,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "idle_up": {
    "row": 2,
    "frames": 8,
    "fps": 6,
    "loop": true
   }
  }
 },
 "npc_guard_look": {
  "src": "assets/flow/anim/npc_guard_look_anim.png",
  "cell": 102,
  "px": 64,
  "rows": {
   "idle_left": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "idle_right": {
    "row": 1,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "idle_up": {
    "row": 2,
    "frames": 8,
    "fps": 6,
    "loop": true
   }
  }
 },
 "npc_bard_look": {
  "src": "assets/flow/anim/npc_bard_look_anim.png",
  "cell": 102,
  "px": 64,
  "rows": {
   "idle_left": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "idle_right": {
    "row": 1,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "idle_up": {
    "row": 2,
    "frames": 8,
    "fps": 6,
    "loop": true
   }
  }
 },
 "npc_juna_look": {
  "src": "assets/flow/anim/npc_juna_look_anim.png",
  "cell": 102,
  "px": 64,
  "rows": {
   "idle_left": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "idle_right": {
    "row": 1,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "idle_up": {
    "row": 2,
    "frames": 8,
    "fps": 6,
    "loop": true
   }
  }
 },
 "npc_odilia_look": {
  "src": "assets/flow/anim/npc_odilia_look_anim.png",
  "cell": 102,
  "px": 64,
  "rows": {
   "idle_left": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "idle_right": {
    "row": 1,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "idle_up": {
    "row": 2,
    "frames": 8,
    "fps": 6,
    "loop": true
   }
  }
 },
 "npc_bras_look": {
  "src": "assets/flow/anim/npc_bras_look_anim.png",
  "cell": 102,
  "px": 64,
  "rows": {
   "idle_left": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "idle_right": {
    "row": 1,
    "frames": 8,
    "fps": 6,
    "loop": true
   },
   "idle_up": {
    "row": 2,
    "frames": 8,
    "fps": 6,
    "loop": true
   }
  }
 },
 "hero_1_walk6": {
  "src": "assets/flow/anim/hero_1_walk6_anim.png",
  "cell": 102,
  "px": 64,
  "rows": {
   "walk_down": {
    "row": 0,
    "frames": 6,
    "fps": 10,
    "loop": true
   },
   "walk_left": {
    "row": 1,
    "frames": 6,
    "fps": 10,
    "loop": true
   },
   "walk_right": {
    "row": 2,
    "frames": 6,
    "fps": 10,
    "loop": true
   },
   "walk_up": {
    "row": 3,
    "frames": 6,
    "fps": 10,
    "loop": true
   }
  }
 },
 "hero_2_walk6": {
  "src": "assets/flow/anim/hero_2_walk6_anim.png",
  "cell": 102,
  "px": 64,
  "rows": {
   "walk_down": {
    "row": 0,
    "frames": 6,
    "fps": 10,
    "loop": true
   },
   "walk_left": {
    "row": 1,
    "frames": 6,
    "fps": 10,
    "loop": true
   },
   "walk_right": {
    "row": 2,
    "frames": 6,
    "fps": 10,
    "loop": true
   },
   "walk_up": {
    "row": 3,
    "frames": 6,
    "fps": 10,
    "loop": true
   }
  }
 },
 "hero_3_walk6": {
  "src": "assets/flow/anim/hero_3_walk6_anim.png",
  "cell": 102,
  "px": 64,
  "rows": {
   "walk_down": {
    "row": 0,
    "frames": 6,
    "fps": 10,
    "loop": true
   },
   "walk_left": {
    "row": 1,
    "frames": 6,
    "fps": 10,
    "loop": true
   },
   "walk_right": {
    "row": 2,
    "frames": 6,
    "fps": 10,
    "loop": true
   },
   "walk_up": {
    "row": 3,
    "frames": 6,
    "fps": 10,
    "loop": true
   }
  }
 },
 "fx_water": {
  "src": "assets/flow/anim/fx_water.png",
  "cell": 64,
  "cellH": 64,
  "fx": true,
  "tiles": 1.0,
  "anchor": "tile inteiro, emenda sem costura",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 12,
    "fps": 6,
    "loop": true
   }
  }
 },
 "fx_water_deep": {
  "src": "assets/flow/anim/fx_water_deep.png",
  "cell": 64,
  "cellH": 64,
  "fx": true,
  "tiles": 1.0,
  "anchor": "tile inteiro, emenda sem costura",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 12,
    "fps": 5,
    "loop": true
   }
  }
 },
 "fx_fishspot": {
  "src": "assets/flow/anim/fx_fishspot.png",
  "cell": 96,
  "cellH": 96,
  "fx": true,
  "tiles": 1.5,
  "anchor": "camada sobre a água, centrada no tile do cardume",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 12,
    "fps": 8,
    "loop": true
   }
  }
 },
 "fx_fishspot_deep": {
  "src": "assets/flow/anim/fx_fishspot_deep.png",
  "cell": 96,
  "cellH": 96,
  "fx": true,
  "tiles": 1.5,
  "anchor": "camada sobre a água, centrada no tile do cardume",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 12,
    "fps": 8,
    "loop": true
   }
  }
 },
 "fx_smoke": {
  "src": "assets/flow/anim/fx_smoke.png",
  "cell": 64,
  "cellH": 64,
  "fx": true,
  "tiles": 1.0,
  "anchor": "origem da fumaça a 12% da altura do quadro, centralizada: alinhe na boca da chaminé",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 16,
    "fps": 8,
    "loop": true
   }
  }
 },
 "fx_smoke_small": {
  "src": "assets/flow/anim/fx_smoke_small.png",
  "cell": 64,
  "cellH": 64,
  "fx": true,
  "tiles": 1.0,
  "anchor": "fumaça leve de fogueira; origem a 12% da altura do quadro, centralizada sobre as chamas",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 16,
    "fps": 8,
    "loop": true
   }
  }
 },
 "fx_leaves": {
  "src": "assets/flow/anim/fx_leaves.png",
  "cell": 64,
  "cellH": 64,
  "fx": true,
  "tiles": 1.0,
  "anchor": "sem loop: folhas caindo do topo do toco, quadro centrado no tile do toco",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 8,
    "fps": 12,
    "loop": false
   }
  }
 },
 "fx_bleed": {
  "src": "assets/flow/anim/fx_bleed.png",
  "cell": 64,
  "cellH": 64,
  "fx": true,
  "tiles": 1.0,
  "anchor": "sem loop: gotas e respingo; centro do quadro no ponto do corte (meio do corpo do monstro)",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 6,
    "fps": 14,
    "loop": false
   }
  }
 },
 "fx_spark_block": {
  "src": "assets/flow/anim/fx_spark_block.png",
  "cell": 64,
  "cellH": 64,
  "fx": true,
  "tiles": 1.0,
  "anchor": "sem loop: faísca azul do aparo; centro do quadro no ponto de contato entre herói e monstro",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 6,
    "fps": 18,
    "loop": false
   }
  }
 },
 "fx_crystal_shards": {
  "src": "assets/flow/anim/fx_crystal_shards.png",
  "cell": 128,
  "cellH": 128,
  "fx": true,
  "tiles": 2.0,
  "anchor": "sem loop: estilhaços de cristal saltam e quicam no chão; base do quadro (12%) no pé do Colosso",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 10,
    "fps": 14,
    "loop": false
   }
  }
 },
 "fx_dust_slam": {
  "src": "assets/flow/anim/fx_dust_slam.png",
  "cell": 128,
  "cellH": 128,
  "fx": true,
  "tiles": 2.0,
  "anchor": "sem loop: anel de poeira e rachaduras no chão; centro do quadro no ponto do impacto",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 8,
    "fps": 14,
    "loop": false
   }
  }
 },
 "fx_dust_slam_light": {
  "src": "assets/flow/anim/fx_dust_slam_light.png",
  "cell": 128,
  "cellH": 128,
  "fx": true,
  "tiles": 2.0,
  "anchor": "sem loop: variante clara com contorno escuro, para chão escuro/marrom; mesma âncora",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 8,
    "fps": 14,
    "loop": false
   }
  }
 },
 "fx_ground_warning": {
  "src": "assets/flow/anim/fx_ground_warning.png",
  "cell": 64,
  "cellH": 64,
  "fx": true,
  "tiles": 1.0,
  "anchor": "loop: rachadura em brasa pulsando, cobre exatamente 1 tile; repita em cada tile da área de perigo",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 12,
    "fps": 10,
    "loop": true
   }
  }
 },
 "fx_rock_rubble": {
  "src": "assets/flow/anim/fx_rock_rubble.png",
  "cell": 64,
  "cellH": 64,
  "fx": true,
  "tiles": 1.0,
  "anchor": "sem loop: pedras rolam de fora para o centro e assentam num montinho; base do quadro (12%) no chão do ponto de renascimento",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 10,
    "fps": 12,
    "loop": false
   }
  }
 },
 "fx_enrage_aura": {
  "src": "assets/flow/anim/fx_enrage_aura.png",
  "cell": 192,
  "cellH": 192,
  "fx": true,
  "tiles": 3.0,
  "anchor": "loop: chamas roxas subindo em anel achatado; base do quadro (12%) no pé do chefe, quadro cobre 3 tiles",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 12,
    "fps": 12,
    "loop": true
   }
  }
 },
 "fx_crystal_glint": {
  "src": "assets/flow/anim/fx_crystal_glint.png",
  "cell": 64,
  "cellH": 64,
  "fx": true,
  "tiles": 1.0,
  "anchor": "loop: brilhos ciano piscando numa poça de cristal; base do quadro (12%) no chão do ponto de renascimento",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 8,
    "fps": 10,
    "loop": true
   }
  }
 },
 "fx_echo_summon": {
  "src": "assets/flow/anim/fx_echo_summon.png",
  "cell": 192,
  "cellH": 192,
  "fx": true,
  "tiles": 3.0,
  "anchor": "sem loop: coluna de névoa ciano sobe do chão e se dissipa; base do quadro (12%) no ponto onde o eco surge",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 10,
    "fps": 12,
    "loop": false
   }
  }
 },
 "fx_echo_fade": {
  "src": "assets/flow/anim/fx_echo_fade.png",
  "cell": 192,
  "cellH": 192,
  "fx": true,
  "tiles": 3.0,
  "anchor": "sem loop: o eco se desfaz em névoa ciano que sobe e se espalha; base do quadro (12%) no pé do eco",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 8,
    "fps": 12,
    "loop": false
   }
  }
 },
 "fx_music_notes": {
  "src": "assets/flow/anim/fx_music_notes.png",
  "cell": 64,
  "cellH": 64,
  "fx": true,
  "tiles": 1.0,
  "anchor": "loop: notas musicais douradas sobem balançando e somem; base do quadro (12%) na altura do ombro do bardo",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 12,
    "fps": 10,
    "loop": true
   }
  }
 },
 "fx_fish_jump": {
  "src": "assets/flow/anim/fx_fish_jump.png",
  "cell": 64,
  "cellH": 64,
  "fx": true,
  "tiles": 1.0,
  "anchor": "sem loop: peixe salta em arco e mergulha com respingo; centro do quadro no tile de água",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 8,
    "fps": 12,
    "loop": false
   }
  }
 },
 "fx_cook_sizzle": {
  "src": "assets/flow/anim/fx_cook_sizzle.png",
  "cell": 64,
  "cellH": 64,
  "fx": true,
  "tiles": 1.0,
  "anchor": "loop: peixe chiando sobre as chamas, com gotas de gordura e fiapos de fumaça; base do quadro (12%) na grelha/fogo",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 8,
    "fps": 12,
    "loop": true
   }
  }
 },
 "fx_thumbs_spark": {
  "src": "assets/flow/anim/fx_thumbs_spark.png",
  "cell": 64,
  "cellH": 64,
  "fx": true,
  "tiles": 1.0,
  "anchor": "sem loop: estrela dourada de 4 pontas pisca, gira e some com brilhinhos; centro do quadro acima da mão do NPC",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 6,
    "fps": 12,
    "loop": false
   }
  }
 },
 "fx_banner_wave": {
  "src": "assets/flow/anim/fx_banner_wave.png",
  "cell": 640,
  "cellH": 120,
  "fx": true,
  "tiles": 0,
  "anchor": "loop: faixa do título (640 x 120 por quadro) ondulando; quadros lado a lado; use no lugar do deco_lobby_banner",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 8,
    "fps": 6,
    "loop": true
   }
  }
 },
 "fx_item_store": {
  "src": "assets/flow/anim/fx_item_store.png",
  "cell": 64,
  "cellH": 64,
  "fx": true,
  "tiles": 1.0,
  "anchor": "sem loop: redemoinho dourado se fecha no centro e acaba num brilho; centro do quadro sobre a tampa do baú (o item encolhe por código)",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 6,
    "fps": 12,
    "loop": false
   }
  }
 },
 "fx_item_take": {
  "src": "assets/flow/anim/fx_item_take.png",
  "cell": 64,
  "cellH": 64,
  "fx": true,
  "tiles": 1.0,
  "anchor": "sem loop: brilho no centro se abre num anel dourado com faíscas espiralando para fora; centro do quadro sobre a tampa do baú (o item cresce por código)",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 6,
    "fps": 12,
    "loop": false
   }
  }
 },
 "fx_cook_batch": {
  "src": "assets/flow/anim/fx_cook_batch.png",
  "cell": 64,
  "cellH": 64,
  "fx": true,
  "tiles": 1.0,
  "anchor": "sem loop: três colunas de fumaça sobem juntas e se dissipam; base do quadro (12%) na grelha da fogueira",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 8,
    "fps": 10,
    "loop": false
   }
  }
 },
 "fx_mob_give_up": {
  "src": "assets/flow/anim/fx_mob_give_up.png",
  "cell": 64,
  "cellH": 64,
  "fx": true,
  "tiles": 1.0,
  "anchor": "sem loop: três pontos de interrogação sobem em sequência e somem; base do quadro (12%) no topo da cabeça do monstro",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 6,
    "fps": 10,
    "loop": false
   }
  }
 },
 "fx_candle_flames": {
  "src": "assets/flow/anim/fx_candle_flames.png",
  "cell": 128,
  "cellH": 128,
  "fx": true,
  "tiles": 0,
  "anchor": "loop: chamas das 3 velas do santuário; quadro do MESMO tamanho e posição da arte deco_shrine_offering (desenhe por cima dela, no mesmo retângulo)",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 6,
    "fps": 10,
    "loop": true
   }
  }
 },
 "fx_offering_coins": {
  "src": "assets/flow/anim/fx_offering_coins.png",
  "cell": 128,
  "cellH": 128,
  "fx": true,
  "tiles": 0,
  "anchor": "sem loop: moedas caem na tigela do santuário; quadro do MESMO tamanho e posição da arte deco_shrine_offering (como as chamas)",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 8,
    "fps": 12,
    "loop": false
   }
  }
 },
 "fx_votive_flame": {
  "src": "assets/flow/anim/fx_votive_flame.png",
  "cell": 64,
  "cellH": 64,
  "fx": true,
  "tiles": 1.0,
  "anchor": "loop: chama dourada flutuante; centro do quadro acima do ombro do herói",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 6,
    "fps": 10,
    "loop": true
   }
  }
 },
 "fx_votive_candles": {
  "src": "assets/flow/anim/fx_votive_candles.png",
  "cell": 128,
  "cellH": 128,
  "fx": true,
  "tiles": 0,
  "anchor": "loop: 3 velas extras acesas na base do santuário; MESMO retângulo da arte deco_shrine_offering (como as chamas)",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 6,
    "fps": 10,
    "loop": true
   }
  }
 },
 "fx_soul_wisp": {
  "src": "assets/flow/anim/fx_soul_wisp.png",
  "cell": 64,
  "cellH": 64,
  "fx": true,
  "tiles": 1.0,
  "anchor": "loop: chama roxa flutuando; base do quadro (12%) no chão do túmulo",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 12,
    "fps": 10,
    "loop": true
   }
  }
 },
 "fx_ground_warning_ring": {
  "src": "assets/flow/anim/fx_ground_warning_ring.png",
  "cell": 320,
  "cellH": 320,
  "fx": true,
  "tiles": 5.0,
  "anchor": "loop: anel de brasa achatado em perspectiva de chão, raio 2,3 tiles; centro do quadro no centro do tremor",
  "rows": {
   "loop": {
    "row": 0,
    "frames": 12,
    "fps": 10,
    "loop": true
   }
  }
 },
 "chest_open": {
  "src": "assets/flow/anim/chest_open_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "open": {
    "row": 0,
    "frames": 6,
    "fps": 10,
    "loop": false,
    "impact": 3
   }
  }
 },
 "res_herb": {
  "src": "assets/flow/anim/res_herb_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "sway": {
    "row": 0,
    "frames": 16,
    "fps": 6,
    "loop": true
   }
  }
 },
 "res_flower": {
  "src": "assets/flow/anim/res_flower_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "sway": {
    "row": 0,
    "frames": 16,
    "fps": 6,
    "loop": true
   }
  }
 },
 "res_moonlily": {
  "src": "assets/flow/anim/res_moonlily_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "sway": {
    "row": 0,
    "frames": 16,
    "fps": 6,
    "loop": true
   }
  }
 },
 "res_crystalbloom": {
  "src": "assets/flow/anim/res_crystalbloom_anim.png",
  "cell": 154,
  "px": 96,
  "rows": {
   "sway": {
    "row": 0,
    "frames": 16,
    "fps": 6,
    "loop": true
   }
  }
 }
};
