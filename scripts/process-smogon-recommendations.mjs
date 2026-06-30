import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../public/data')

// 加载数据
const smogonData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'smogon-sets-raw.json'), 'utf-8'))
const pokemons = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'pokemon.json'), 'utf-8'))
const nameMaps = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'name-maps.json'), 'utf-8'))

// 招式名称映射：Smogon显示名 → PokeRogue move ID
// Smogon使用英文显示名（首字母大写，空格分隔，如 "Flamethrower"）
// PokeRogue使用内部ID（全大写，下划线分隔，如 "FLAMETHROWER"）
const moveNameToId = new Map()
for (const id of Object.keys(nameMaps.move || {})) {
  // Smogon格式: "FLAMETHROWER" → "Flamethrower"
  const smogonName = id
    .toLowerCase()
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  moveNameToId.set(smogonName, id)

  // 也处理带连字符的（如 "U-turn"）
  const smogonNameHyphen = id
    .toLowerCase()
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('-')
  moveNameToId.set(smogonNameHyphen, id)
}

// 特殊招式名映射（Smogon和PokeRogue命名不一致的情况）
const specialMoveMappings = {
  'Will-O-Wisp': 'WILL_O_WISP',
  'Will-O-wisp': 'WILL_O_WISP',
  'U-turn': 'U_TURN',
  'U-Turn': 'U_TURN',
  'V-create': 'V_CREATE',
  'V-Create': 'V_CREATE',
  'X-Scissor': 'X_SCISSOR',
  'Power-Up Punch': 'POWER_UP_PUNCH',
  'Power-up Punch': 'POWER_UP_PUNCH',
  'Double-Edge': 'DOUBLE_EDGE',
  'Self-Destruct': 'SELF_DESTRUCT',
  'Soft-Boiled': 'SOFT_BOILED',
  'Wake-Up Slap': 'WAKE_UP_SLAP',
  'Thunder Punch': 'THUNDER_PUNCH',
  'Thunder Shock': 'THUNDER_SHOCK',
  'Thunder Wave': 'THUNDER_WAVE',
  'Thunder Fang': 'THUNDER_FANG',
  'Thunderbolt': 'THUNDERBOLT',
  'Solar Beam': 'SOLAR_BEAM',
  'Solar Blade': 'SOLAR_BLADE',
  'Hyper Beam': 'HYPER_BEAM',
  'Hyper Voice': 'HYPER_VOICE',
  'Hyper Fang': 'HYPER_FANG',
  'Ice Beam': 'ICE_BEAM',
  'Ice Punch': 'ICE_PUNCH',
  'Ice Fang': 'ICE_FANG',
  'Ice Shard': 'ICE_SHARD',
  'Fire Blast': 'FIRE_BLAST',
  'Fire Punch': 'FIRE_PUNCH',
  'Fire Fang': 'FIRE_FANG',
  'Fire Spin': 'FIRE_SPIN',
  'Focus Blast': 'FOCUS_BLAST',
  'Focus Punch': 'FOCUS_PUNCH',
  'Shadow Ball': 'SHADOW_BALL',
  'Shadow Claw': 'SHADOW_CLAW',
  'Shadow Punch': 'SHADOW_PUNCH',
  'Shadow Sneak': 'SHADOW_SNEAK',
  'Aerial Ace': 'AERIAL_ACE',
  'Air Slash': 'AIR_SLASH',
  'Air Cutter': 'AIR_CUTTER',
  'Ancient Power': 'ANCIENT_POWER',
  'Aura Sphere': 'AURA_SPHERE',
  'Bug Buzz': 'BUG_BUZZ',
  'Bug Bite': 'BUG_BITE',
  'Cross Chop': 'CROSS_CHOP',
  'Cross Poison': 'CROSS_POISON',
  'Dark Pulse': 'DARK_PULSE',
  'Dragon Claw': 'DRAGON_CLAW',
  'Dragon Pulse': 'DRAGON_PULSE',
  'Dragon Rush': 'DRAGON_RUSH',
  'Dragon Tail': 'DRAGON_TAIL',
  'Dragon Dance': 'DRAGON_DANCE',
  'Drill Peck': 'DRILL_PECK',
  'Drill Run': 'DRILL_RUN',
  'Dynamic Punch': 'DYNAMIC_PUNCH',
  'Energy Ball': 'ENERGY_BALL',
  'Extreme Speed': 'EXTREME_SPEED',
  'False Swipe': 'FALSE_SWIPE',
  'Flash Cannon': 'FLASH_CANNON',
  'Fury Swipes': 'FURY_SWIPES',
  'Giga Drain': 'GIGA_DRAIN',
  'Giga Impact': 'GIGA_IMPACT',
  'Grass Knot': 'GRASS_KNOT',
  'Gunk Shot': 'GUNK_SHOT',
  'Hammer Arm': 'HAMMER_ARM',
  'Head Smash': 'HEAD_SMASH',
  'Heat Wave': 'HEAT_WAVE',
  'Heavy Slam': 'HEAVY_SLAM',
  'High Jump Kick': 'HIGH_JUMP_KICK',
  'Horn Leech': 'HORN_LEECH',
  'Hydro Pump': 'HYDRO_PUMP',
  'Iron Head': 'IRON_HEAD',
  'Iron Tail': 'IRON_TAIL',
  'Leaf Blade': 'LEAF_BLADE',
  'Leaf Storm': 'LEAF_STORM',
  'Leech Life': 'LEECH_LIFE',
  'Liquidation': 'LIQUIDATION',
  'Low Kick': 'LOW_KICK',
  'Low Sweep': 'LOW_SWEEP',
  'Mach Punch': 'MACH_PUNCH',
  'Mega Drain': 'MEGA_DRAIN',
  'Metal Claw': 'METAL_CLAW',
  'Mud Shot': 'MUD_SHOT',
  'Mud-Slap': 'MUD_SLAP',
  'Night Slash': 'NIGHT_SLASH',
  'Payback': 'PAYBACK',
  'Petal Blizzard': 'PETAL_BLIZZARD',
  'Petal Dance': 'PETAL_DANCE',
  'Play Rough': 'PLAY_ROUGH',
  'Poison Jab': 'POISON_JAB',
  'Power Gem': 'POWER_GEM',
  'Power Whip': 'POWER_WHIP',
  'Psybeam': 'PSYBEAM',
  'Psychic': 'PSYCHIC',
  'Psyshock': 'PSYSHOCK',
  'Quick Attack': 'QUICK_ATTACK',
  'Razor Leaf': 'RAZOR_LEAF',
  'Rock Blast': 'ROCK_BLAST',
  'Rock Slide': 'ROCK_SLIDE',
  'Rock Throw': 'ROCK_THROW',
  'Rock Tomb': 'ROCK_TOMB',
  'Scald': 'SCALD',
  'Seed Bomb': 'SEED_BOMB',
  'Shadow Ball': 'SHADOW_BALL',
  'Signal Beam': 'SIGNAL_BEAM',
  'Silver Wind': 'SILVER_WIND',
  'Sky Attack': 'SKY_ATTACK',
  'Sludge Bomb': 'SLUDGE_BOMB',
  'Sludge Wave': 'SLUDGE_WAVE',
  'Smart Strike': 'SMART_STRIKE',
  'Stealth Rock': 'STEALTH_ROCK',
  'Stone Edge': 'STONE_EDGE',
  'Struggle Bug': 'STRUGGLE_BUG',
  'Sucker Punch': 'SUCKER_PUNCH',
  'Superpower': 'SUPERPOWER',
  'Surf': 'SURF',
  'Swift': 'SWIFT',
  'Swords Dance': 'SWORDS_DANCE',
  'Tackle': 'TACKLE',
  'Take Down': 'TAKE_DOWN',
  'Thief': 'THIEF',
  'Thunder': 'THUNDER',
  'Tri Attack': 'TRI_ATTACK',
  'Triple Axel': 'TRIPLE_AXEL',
  'U-turn': 'U_TURN',
  'Vacuum Wave': 'VACUUM_WAVE',
  'Volt Switch': 'VOLT_SWITCH',
  'Water Pulse': 'WATER_PULSE',
  'Waterfall': 'WATERFALL',
  'Wild Charge': 'WILD_CHARGE',
  'Wood Hammer': 'WOOD_HAMMER',
  'Zen Headbutt': 'ZEN_HEADBUTT',
  'Zap Cannon': 'ZAP_CANNON',
  'Body Press': 'BODY_PRESS',
  'Body Slam': 'BODY_SLAM',
  'Brave Bird': 'BRAVE_BIRD',
  'Brick Break': 'BRICK_BREAK',
  'Bulk Up': 'BULK_UP',
  'Bullet Punch': 'BULLET_PUNCH',
  'Bullet Seed': 'BULLET_SEED',
  'Calm Mind': 'CALM_MIND',
  'Charge Beam': 'CHARGE_BEAM',
  'Close Combat': 'CLOSE_COMBAT',
  'Confuse Ray': 'CONFUSE_RAY',
  'Cosmic Power': 'COSMIC_POWER',
  'Cotton Guard': 'COTTON_GUARD',
  'Crunch': 'CRUNCH',
  'Crush Claw': 'CRUSH_CLAW',
  'Curse': 'CURSE',
  'Dazzling Gleam': 'DAZZLING_GLEAM',
  'Defog': 'DEFOG',
  'Dig': 'DIG',
  'Discharge': 'DISCHARGE',
  'Dive': 'DIVE',
  'Double Hit': 'DOUBLE_HIT',
  'Double Kick': 'DOUBLE_KICK',
  'Draco Meteor': 'DRACO_METEOR',
  'Dragon Breath': 'DRAGON_BREATH',
  'Drain Punch': 'DRAIN_PUNCH',
  'Dream Eater': 'DREAM_EATER',
  'Earth Power': 'EARTH_POWER',
  'Earthquake': 'EARTHQUAKE',
  'Echoed Voice': 'ECHOED_VOICE',
  'Electro Ball': 'ELECTRO_BALL',
  'Electroweb': 'ELECTROWEB',
  'Ember': 'EMBER',
  'Encore': 'ENCORE',
  'Endeavor': 'ENDEAVOR',
  'Energy Ball': 'ENERGY_BALL',
  'Eruption': 'ERUPTION',
  'Explosion': 'EXPLOSION',
  'Facade': 'FACADE',
  'Fake Out': 'FAKE_OUT',
  'Feint Attack': 'FEINT_ATTACK',
  'Fiery Dance': 'FIERY_DANCE',
  'Final Gambit': 'FINAL_GAMBIT',
  'Fire Lash': 'FIRE_LASH',
  'First Impression': 'FIRST_IMPRESSION',
  'Flail': 'FLAIL',
  'Flame Charge': 'FLAME_CHARGE',
  'Flame Wheel': 'FLAME_WHEEL',
  'Flare Blitz': 'FLARE_BLITZ',
  'Fling': 'FLING',
  'Foul Play': 'FOUL_PLAY',
  'Freeze-Dry': 'FREEZE_DRY',
  'Frost Breath': 'FROST_BREATH',
  'Fury Attack': 'FURY_ATTACK',
  'Fury Cutter': 'FURY_CUTTER',
  'Future Sight': 'FUTURE_SIGHT',
  'Gear Grind': 'GEAR_GRIND',
  'Giga Impact': 'GIGA_IMPACT',
  'Glacial Lance': 'GLACIAL_LANCE',
  'Grass Pledge': 'GRASS_PLEDGE',
  'Grassy Glide': 'GRASSY_GLIDE',
  'Growl': 'GROWL',
  'Growth': 'GROWTH',
  'Grudge': 'GRUDGE',
  'Guard Swap': 'GUARD_SWAP',
  'Gust': 'GUST',
  'Gyro Ball': 'GYRO_BALL',
  'Hail': 'HAIL',
  'Harden': 'HARDEN',
  'Haze': 'HAZE',
  'Head Charge': 'HEAD_CHARGE',
  'Headbutt': 'HEADBUTT',
  'Heal Bell': 'HEAL_BELL',
  'Heal Block': 'HEAL_BLOCK',
  'Healing Wish': 'HEALING_WISH',
  'Heart Stamp': 'HEART_STAMP',
  'Heat Crash': 'HEAT_CRASH',
  'Helping Hand': 'HELPING_HAND',
  'Hex': 'HEX',
  'Hidden Power': 'HIDDEN_POWER',
  'High Horsepower': 'HIGH_HORSEPOWER',
  'Hone Claws': 'HONE_CLAWS',
  'Horn Attack': 'HORN_ATTACK',
  'Horn Drill': 'HORN_DRILL',
  'Howl': 'HOWL',
  'Hurricane': 'HURRICANE',
  'Hydro Cannon': 'HYDRO_CANNON',
  'Hydro Steam': 'HYDRO_STEAM',
  'Hyper Drill': 'HYPER_DRILL',
  'Hypnosis': 'HYPNOSIS',
  'Ice Ball': 'ICE_BALL',
  'Ice Burn': 'ICE_BURN',
  'Ice Fang': 'ICE_FANG',
  'Ice Punch': 'ICE_PUNCH',
  'Ice Shard': 'ICE_SHARD',
  'Icicle Crash': 'ICICLE_CRASH',
  'Icicle Spear': 'ICICLE_SPEAR',
  'Icy Wind': 'ICY_WIND',
  'Imprison': 'IMPRISON',
  'Incinerate': 'INCINERATE',
  'Inferno': 'INFERNO',
  'Infestation': 'INFESTATION',
  'Ingrain': 'INGRAIN',
  'Iron Defense': 'IRON_DEFENSE',
  'Jaw Lock': 'JAW_LOCK',
  'Jet Punch': 'JET_PUNCH',
  'Judgment': 'JUDGMENT',
  'Jump Kick': 'JUMP_KICK',
  'Knock Off': 'KNOCK_OFF',
  'Lands Wrath': 'LANDS_WRATH',
  'Laser Focus': 'LASER_FOCUS',
  'Lash Out': 'LASH_OUT',
  'Last Resort': 'LAST_RESORT',
  'Lava Plume': 'LAVA_PLUME',
  'Leaf Tornado': 'LEAF_TORNADO',
  'Leer': 'LEER',
  'Lick': 'LICK',
  'Life Dew': 'LIFE_DEW',
  'Light Screen': 'LIGHT_SCREEN',
  'Liquidation': 'LIQUIDATION',
  'Lock-On': 'LOCK_ON',
  'Lovely Kiss': 'LOVELY_KISS',
  'Low Kick': 'LOW_KICK',
  'Lunge': 'LUNGE',
  'Mach Punch': 'MACH_PUNCH',
  'Magic Coat': 'MAGIC_COAT',
  'Magical Leaf': 'MAGICAL_LEAF',
  'Magma Storm': 'MAGMA_STORM',
  'Magnet Bomb': 'MAGNET_BOMB',
  'Magnet Rise': 'MAGNET_RISE',
  'Magnetic Flux': 'MAGNETIC_FLUX',
  'Magnitude': 'MAGNITUDE',
  'Memento': 'MEMENTO',
  'Metal Burst': 'METAL_BURST',
  'Metal Sound': 'METAL_SOUND',
  'Meteor Beam': 'METEOR_BEAM',
  'Meteor Mash': 'METEOR_MASH',
  'Metronome': 'METRONOME',
  'Milk Drink': 'MILK_DRINK',
  'Mimic': 'MIMIC',
  'Mind Reader': 'MIND_READER',
  'Mirror Coat': 'MIRROR_COAT',
  'Mirror Move': 'MIRROR_MOVE',
  'Mist': 'MIST',
  'Mist Ball': 'MIST_BALL',
  'Moonblast': 'MOONBLAST',
  'Moongeist Beam': 'MOONGEIST_BEAM',
  'Moonlight': 'MOONLIGHT',
  'Morning Sun': 'MORNING_SUN',
  'Mud Bomb': 'MUD_BOMB',
  'Muddy Water': 'MUDDY_WATER',
  'Nasty Plot': 'NASTY_PLOT',
  'Natural Gift': 'NATURAL_GIFT',
  'Nature Power': 'NATURE_POWER',
  'Night Daze': 'NIGHT_DAZE',
  'Night Shade': 'NIGHT_SHADE',
  'Night Slash': 'NIGHT_SLASH',
  'Noble Roar': 'NOBLE_ROAR',
  'Nuzzle': 'NUZZLE',
  'Oblivion Wing': 'OBLIVION_WING',
  'Octazooka': 'OCTAZOOKA',
  'Ominous Wind': 'OMINOUS_WIND',
  'Origin Pulse': 'ORIGIN_PULSE',
  'Outrage': 'OUTRAGE',
  'Overheat': 'OVERHEAT',
  'Pain Split': 'PAIN_SPLIT',
  'Parabolic Charge': 'PARABOLIC_CHARGE',
  'Parting Shot': 'PARTING_SHOT',
  'Pay Day': 'PAY_DAY',
  'Peck': 'PECK',
  'Perish Song': 'PERISH_SONG',
  'Petal Dance': 'PETAL_DANCE',
  'Phantom Force': 'PHANTOM_FORCE',
  'Pin Missile': 'PIN_MISSILE',
  'Plasma Fists': 'PLASMA_FISTS',
  'Play Nice': 'PLAY_NICE',
  'Poison Fang': 'POISON_FANG',
  'Poison Gas': 'POISON_GAS',
  'Poison Powder': 'POISON_POWDER',
  'Poison Sting': 'POISON_STING',
  'Poison Tail': 'POISON_TAIL',
  'Pollen Puff': 'POLLEN_PUFF',
  'Pound': 'POUND',
  'Powder Snow': 'POWDER_SNOW',
  'Power Split': 'POWER_SPLIT',
  'Power Swap': 'POWER_SWAP',
  'Power Trick': 'POWER_TRICK',
  'Power-Up Punch': 'POWER_UP_PUNCH',
  'Present': 'PRESENT',
  'Protect': 'PROTECT',
  'Psybeam': 'PSYBEAM',
  'Psychic Fangs': 'PSYCHIC_FANGS',
  'Psychic Noise': 'PSYCHIC_NOISE',
  'Psycho Boost': 'PSYCHO_BOOST',
  'Psycho Cut': 'PSYCHO_CUT',
  'Psyshock': 'PSYSHOCK',
  'Psystrike': 'PSYSTRIKE',
  'Pursuit': 'PURSUIT',
  'Quash': 'QUASH',
  'Quick Attack': 'QUICK_ATTACK',
  'Quick Guard': 'QUICK_GUARD',
  'Quiver Dance': 'QUIVER_DANCE',
  'Rage Powder': 'RAGE_POWDER',
  'Rapid Spin': 'RAPID_SPIN',
  'Razor Leaf': 'RAZOR_LEAF',
  'Razor Shell': 'RAZOR_SHELL',
  'Recover': 'RECOVER',
  'Recycle': 'RECYCLE',
  'Reflect': 'REFLECT',
  'Reflect Type': 'REFLECT_TYPE',
  'Rest': 'REST',
  'Retaliate': 'RETALIATE',
  'Return': 'RETURN',
  'Revenge': 'REVENGE',
  'Reversal': 'REVERSAL',
  'Rising Voltage': 'RISING_VOLTAGE',
  'Roar': 'ROAR',
  'Rock Blast': 'ROCK_BLAST',
  'Rock Climb': 'ROCK_CLIMB',
  'Rock Polish': 'ROCK_POLISH',
  'Rock Slide': 'ROCK_SLIDE',
  'Rock Smash': 'ROCK_SMASH',
  'Rock Throw': 'ROCK_THROW',
  'Rock Tomb': 'ROCK_TOMB',
  'Rock Wrecker': 'ROCK_WRECKER',
  'Role Play': 'ROLE_PLAY',
  'Rolling Kick': 'ROLLING_KICK',
  'Roost': 'ROOST',
  'Round': 'ROUND',
  'Sacred Fire': 'SACRED_FIRE',
  'Sacred Sword': 'SACRED_SWORD',
  'Safeguard': 'SAFEGUARD',
  'Sand Attack': 'SAND_ATTACK',
  'Sand Tomb': 'SAND_TOMB',
  'Sandstorm': 'SANDSTORM',
  'Scald': 'SCALD',
  'Scale Shot': 'SCALE_SHOT',
  'Scary Face': 'SCARY_FACE',
  'Scorching Sands': 'SCORCHING_SANDS',
  'Scratch': 'SCRATCH',
  'Seed Bomb': 'SEED_BOMB',
  'Seed Flare': 'SEED_FLARE',
  'Seismic Toss': 'SEISMIC_TOSS',
  'Shadow Ball': 'SHADOW_BALL',
  'Shadow Bone': 'SHADOW_BONE',
  'Shadow Claw': 'SHADOW_CLAW',
  'Shadow Force': 'SHADOW_FORCE',
  'Shadow Punch': 'SHADOW_PUNCH',
  'Shadow Sneak': 'SHADOW_SNEAK',
  'Sharpen': 'SHARPEN',
  'Sheer Cold': 'SHEER_COLD',
  'Shell Smash': 'SHELL_SMASH',
  'Shift Gear': 'SHIFT_GEAR',
  'Shock Wave': 'SHOCK_WAVE',
  'Signal Beam': 'SIGNAL_BEAM',
  'Silver Wind': 'SILVER_WIND',
  'Sing': 'SING',
  'Sketch': 'SKETCH',
  'Skill Swap': 'SKILL_SWAP',
  'Skull Bash': 'SKULL_BASH',
  'Sky Attack': 'SKY_ATTACK',
  'Sky Drop': 'SKY_DROP',
  'Sky Uppercut': 'SKY_UPPERCUT',
  'Slack Off': 'SLACK_OFF',
  'Slam': 'SLAM',
  'Slash': 'SLASH',
  'Sleep Powder': 'SLEEP_POWDER',
  'Sleep Talk': 'SLEEP_TALK',
  'Sludge': 'SLUDGE',
  'Sludge Bomb': 'SLUDGE_BOMB',
  'Sludge Wave': 'SLUDGE_WAVE',
  'Smack Down': 'SMACK_DOWN',
  'Smart Strike': 'SMART_STRIKE',
  'Smelling Salts': 'SMELLING_SALTS',
  'SmokeScreen': 'SMOKE_SCREEN',
  'Snarl': 'SNARL',
  'Snore': 'SNORE',
  'Soak': 'SOAK',
  'Soft-Boiled': 'SOFT_BOILED',
  'Solar Beam': 'SOLAR_BEAM',
  'Solar Blade': 'SOLAR_BLADE',
  'Sonic Boom': 'SONIC_BOOM',
  'Spacial Rend': 'SPACIAL_REND',
  'Spark': 'SPARK',
  'Sparkling Aria': 'SPARKLING_ARIA',
  'Spectral Thief': 'SPECTRAL_THIEF',
  'Speed Swap': 'SPEED_SWAP',
  'Spike Cannon': 'SPIKE_CANNON',
  'Spikes': 'SPIKES',
  'Spiky Shield': 'SPIKY_SHIELD',
  'Spirit Break': 'SPIRIT_BREAK',
  'Spirit Shackle': 'SPIRIT_SHACKLE',
  'Spit Up': 'SPIT_UP',
  'Spite': 'SPITE',
  'Splash': 'SPLASH',
  'Stealth Rock': 'STEALTH_ROCK',
  'Steam Eruption': 'STEAM_ERUPTION',
  'Steamroller': 'STEAMROLLER',
  'Steel Beam': 'STEEL_BEAM',
  'Steel Roller': 'STEEL_ROLLER',
  'Steel Wing': 'STEEL_WING',
  'Sticky Web': 'STICKY_WEB',
  'Stockpile': 'STOCKPILE',
  'Stomp': 'STOMP',
  'Stomping Tantrum': 'STOMPING_TANTRUM',
  'Stone Edge': 'STONE_EDGE',
  'Stored Power': 'STORED_POWER',
  'Storm Throw': 'STORM_THROW',
  'Strange Steam': 'STRANGE_STEAM',
  'Strength': 'STRENGTH',
  'Strength Sap': 'STRENGTH_SAP',
  'String Shot': 'STRING_SHOT',
  'Struggle': 'STRUGGLE',
  'Struggle Bug': 'STRUGGLE_BUG',
  'Stun Spore': 'STUN_SPORE',
  'Submission': 'SUBMISSION',
  'Substitute': 'SUBSTITUTE',
  'Sucker Punch': 'SUCKER_PUNCH',
  'Sunny Day': 'SUNNY_DAY',
  'Sunsteel Strike': 'SUNSTEEL_STRIKE',
  'Super Fang': 'SUPER_FANG',
  'Superpower': 'SUPERPOWER',
  'Supersonic': 'SUPERSONIC',
  'Surf': 'SURF',
  'Swagger': 'SWAGGER',
  'Swallow': 'SWALLOW',
  'Sweet Kiss': 'SWEET_KISS',
  'Sweet Scent': 'SWEET_SCENT',
  'Swift': 'SWIFT',
  'Switcheroo': 'SWITCHEROO',
  'Swords Dance': 'SWORDS_DANCE',
  'Synchronoise': 'SYNCHRONOISE',
  'Synthesis': 'SYNTHESIS',
  'Tackle': 'TACKLE',
  'Tail Glow': 'TAIL_GLOW',
  'Tail Slap': 'TAIL_SLAP',
  'Tail Whip': 'TAIL_WHIP',
  'Tailwind': 'TAILWIND',
  'Take Down': 'TAKE_DOWN',
  'Take Heart': 'TAKE_HEART',
  'Taunt': 'TAUNT',
  'Tearful Look': 'TEARFUL_LOOK',
  'Teeter Dance': 'TEETER_DANCE',
  'Teleport': 'TELEPORT',
  'Thief': 'THIEF',
  'Thousand Arrows': 'THOUSAND_ARROWS',
  'Thousand Waves': 'THOUSAND_WAVES',
  'Thrash': 'THRASH',
  'Thunder': 'THUNDER',
  'Thunder Cage': 'THUNDER_CAGE',
  'Thunder Fang': 'THUNDER_FANG',
  'Thunder Punch': 'THUNDER_PUNCH',
  'Thunder Shock': 'THUNDER_SHOCK',
  'Thunder Wave': 'THUNDER_WAVE',
  'Thunderbolt': 'THUNDERBOLT',
  'Thunderous Kick': 'THUNDEROUS_KICK',
  'Tickle': 'TICKLE',
  'Topsy-Turvy': 'TOPSY_TURVY',
  'Torment': 'TORMENT',
  'Toxic': 'TOXIC',
  'Toxic Spikes': 'TOXIC_SPIKES',
  'Toxic Thread': 'TOXIC_THREAD',
  'Trailblaze': 'TRAILBLAZE',
  'Transform': 'TRANSFORM',
  'Tri Attack': 'TRI_ATTACK',
  'Trick': 'TRICK',
  'Trick Room': 'TRICK_ROOM',
  'Triple Axel': 'TRIPLE_AXEL',
  'Triple Kick': 'TRIPLE_KICK',
  'Trop Kick': 'TROP_KICK',
  'Trump Card': 'TRUMP_CARD',
  'Twineedle': 'TWINEEDLE',
  'Twister': 'TWISTER',
  'U-turn': 'U_TURN',
  'U Turn': 'U_TURN',
  'Upper Hand': 'UPPER_HAND',
  'Vacuum Wave': 'VACUUM_WAVE',
  'Veevee Volley': 'VEEVEE_VOLLEY',
  'Venom Drench': 'VENOM_DRENCH',
  'Venoshock': 'VENOSHOCK',
  'Vice Grip': 'VISE_GRIP',
  'Vine Whip': 'VINE_WHIP',
  'Vital Throw': 'VITAL_THROW',
  'Volt Switch': 'VOLT_SWITCH',
  'Volt Tackle': 'VOLT_TACKLE',
  'Water Gun': 'WATER_GUN',
  'Water Pledge': 'WATER_PLEDGE',
  'Water Pulse': 'WATER_PULSE',
  'Water Shuriken': 'WATER_SHURIKEN',
  'Water Sport': 'WATER_SPORT',
  'Water Spout': 'WATER_SPOUT',
  'Waterfall': 'WATERFALL',
  'Weather Ball': 'WEATHER_BALL',
  'Whirlpool': 'WHIRLPOOL',
  'Whirlwind': 'WHIRLWIND',
  'Wide Guard': 'WIDE_GUARD',
  'Wild Charge': 'WILD_CHARGE',
  'Wildbolt Storm': 'WILDBOLT_STORM',
  'Will-O-Wisp': 'WILL_O_WISP',
  'Will O Wisp': 'WILL_O_WISP',
  'Wing Attack': 'WING_ATTACK',
  'Wish': 'WISH',
  'Withdraw': 'WITHDRAW',
  'Wood Hammer': 'WOOD_HAMMER',
  'Work Up': 'WORK_UP',
  'Worry Seed': 'WORRY_SEED',
  'Wrap': 'WRAP',
  'Wring Out': 'WRING_OUT',
  'X-Scissor': 'X_SCISSOR',
  'Yawn': 'YAWN',
  'Zap Cannon': 'ZAP_CANNON',
  'Zen Headbutt': 'ZEN_HEADBUTT',
  'Zing Zap': 'ZING_ZAP',
}

// 合并特殊映射
for (const [smogonName, pokeRogueId] of Object.entries(specialMoveMappings)) {
  moveNameToId.set(smogonName, pokeRogueId)
}

// 处理Smogon招式名中的特殊字符
function normalizeSmogonMoveName(name) {
  return name
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// 从Smogon sets中提取推荐招式，按类别分组
function extractRecommendedMoves(smogonPokemonData, pokeRogueMoveIds) {
  const moveStats = new Map()

  // 遍历所有格式和sets
  for (const [format, sets] of Object.entries(smogonPokemonData)) {
    for (const [setName, setData] of Object.entries(sets)) {
      if (!setData.moves) continue

      for (const move of setData.moves) {
        // moves可能是字符串或字符串数组（多选一）
        const moveNames = Array.isArray(move) ? move : [move]

        for (const moveName of moveNames) {
          const normalizedName = normalizeSmogonMoveName(moveName)
          let moveId = moveNameToId.get(moveName) || moveNameToId.get(normalizedName)

          // 尝试更多变体
          if (!moveId) {
            // 尝试首字母大写版本
            const titleCase = moveName.split(/[\s-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
            moveId = moveNameToId.get(titleCase)
          }

          if (moveId && pokeRogueMoveIds.has(moveId)) {
            // 只统计PokeRogue中可学会的招式
            const stats = moveStats.get(moveId) || { count: 0, formats: new Set(), sets: new Set() }
            stats.count++
            stats.formats.add(format)
            stats.sets.add(setName)
            moveStats.set(moveId, stats)
          }
        }
      }
    }
  }

  // 转换为数组并排序
  const moves = Array.from(moveStats.entries()).map(([moveId, stats]) => ({
    moveId,
    count: stats.count,
    formatCount: stats.formats.size,
    setCount: stats.sets.size,
  }))

  // 按出现次数排序
  moves.sort((a, b) => b.count - a.count)

  return moves
}

// 分类招式
function categorizeMoves(moveIds, allMovesData) {
  const offensive = []
  const setup = []
  const recovery = []
  const control = []
  const other = []

  const setupMoves = new Set([
    'SWORDS_DANCE', 'DRAGON_DANCE', 'BULK_UP', 'COIL', 'HONE_CLAWS',
    'SHIFT_GEAR', 'CURSE', 'VICTORY_DANCE', 'HOWL', 'NASTY_PLOT',
    'CALM_MIND', 'QUIVER_DANCE', 'TAIL_GLOW', 'CHARGE_BEAM', 'TORCH_SONG',
    'AGILITY', 'AUTOTOMIZE', 'ROCK_POLISH', 'FLAME_CHARGE', 'TRAILBLAZE',
    'SHELL_SMASH', 'WORK_UP', 'GROWTH', 'GEAR_UP', 'ROTOTILLER',
  ])

  const recoveryMoves = new Set([
    'RECOVER', 'ROOST', 'SOFT_BOILED', 'MOONLIGHT', 'MORNING_SUN',
    'SYNTHESIS', 'SLACK_OFF', 'SHORE_UP', 'WISH', 'HEAL_ORDER',
    'JUNGLE_HEALING', 'OBLIVION_WING', 'LIFE_DEW', 'MILK_DRINK',
    'REST', 'PAIN_SPLIT', 'STRENGTH_SAP', 'HEALING_WISH',
  ])

  const controlMoves = new Set([
    'THUNDER_WAVE', 'WILL_O_WISP', 'TOXIC', 'STEALTH_ROCK', 'SPIKES',
    'TOXIC_SPIKES', 'TAUNT', 'ENCORE', 'KNOCK_OFF', 'LEECH_SEED',
    'RAPID_SPIN', 'DEFOG', 'AURORA_VEIL', 'REFLECT', 'LIGHT_SCREEN',
    'TRICK_ROOM', 'SPORE', 'YAWN', 'HYPNOSIS', 'SLEEP_POWDER',
    'STUN_SPORE', 'GLARE', 'NUZZLE', 'TOXIC_THREAD', 'STICKY_WEB',
    'PARTING_SHOT', 'U_TURN', 'VOLT_SWITCH', 'FLIP_TURN', 'CHILLY_RECEPTION',
    'ROAR', 'WHIRLWIND', 'CIRCLE_THROW', 'DRAGON_TAIL', 'Haze',
  ])

  for (const moveId of moveIds) {
    const moveData = allMovesData.find(m => m.moveId === moveId)
    if (!moveData) continue

    if (setupMoves.has(moveId)) {
      setup.push(moveId)
    } else if (recoveryMoves.has(moveId)) {
      recovery.push(moveId)
    } else if (controlMoves.has(moveId)) {
      control.push(moveId)
    } else if (moveData.category && moveData.power && moveData.power > 0) {
      offensive.push(moveId)
    } else {
      other.push(moveId)
    }
  }

  return { offensive, setup, recovery, control, other }
}

// 构建多套推荐方案
function buildRecommendationSets(allMoves, categorized, topMoves) {
  const sets = []

  // 方案1: 综合推荐（Top 4）
  if (topMoves.length >= 3) {
    sets.push({
      name: '综合推荐',
      description: '基于Smogon所有对战分级中出现频率最高的招式',
      moves: topMoves.slice(0, 4).map(m => m.moveId),
    })
  }

  // 方案2: 输出向（优先攻击招式）
  const offensiveMoves = allMoves.filter(m => categorized.offensive.includes(m.moveId))
  if (offensiveMoves.length >= 3) {
    sets.push({
      name: '输出向',
      description: '优先选择高威力攻击招式，追求最大化伤害',
      moves: offensiveMoves.slice(0, 4).map(m => m.moveId),
    })
  }

  // 方案3: 功能向（优先强化/回复/控场）
  const utilityMoves = allMoves.filter(m =>
    categorized.setup.includes(m.moveId) ||
    categorized.recovery.includes(m.moveId) ||
    categorized.control.includes(m.moveId)
  )
  if (utilityMoves.length >= 2) {
    // 功能向需要至少2个功能招+2个攻击招
    const utilityTop = utilityMoves.slice(0, 2).map(m => m.moveId)
    const attackFillers = allMoves
      .filter(m => categorized.offensive.includes(m.moveId) && !utilityTop.includes(m.moveId))
      .slice(0, 2)
      .map(m => m.moveId)
    const combined = [...utilityTop, ...attackFillers]
    if (combined.length >= 3) {
      sets.push({
        name: '功能向',
        description: '优先选择强化、回复或控场招式，兼顾稳定性',
        moves: combined.slice(0, 4),
      })
    }
  }

  // 方案4: 强化向（如果有强化招式）
  if (categorized.setup.length > 0) {
    const setupMove = categorized.setup[0]
    const attackMoves = allMoves
      .filter(m => categorized.offensive.includes(m.moveId) && m.moveId !== setupMove)
      .slice(0, 3)
      .map(m => m.moveId)
    const combined = [setupMove, ...attackMoves]
    if (combined.length >= 3) {
      sets.push({
        name: '强化向',
        description: '以强化招式为核心，配合攻击招式滚雪球',
        moves: combined.slice(0, 4),
      })
    }
  }

  return sets
}

// 主处理逻辑
const recommendations = new Map()
let mappedCount = 0
let unmappedMoves = new Set()

for (const pokemon of pokemons) {
  const smogonData_for_pokemon = smogonData[pokemon.nameEn]
  if (!smogonData_for_pokemon) {
    continue
  }

  // 收集PokeRogue中可学会的所有招式ID和数据
  const pokeRogueMoveIds = new Set()
  const pokeRogueMovesData = []

  for (const move of pokemon.levelMoves || []) {
    if (!pokeRogueMoveIds.has(move.moveId)) {
      pokeRogueMoveIds.add(move.moveId)
      pokeRogueMovesData.push(move)
    }
  }
  for (const move of pokemon.eggMoves || []) {
    if (!pokeRogueMoveIds.has(move.moveId)) {
      pokeRogueMoveIds.add(move.moveId)
      pokeRogueMovesData.push(move)
    }
  }

  const allMoves = extractRecommendedMoves(smogonData_for_pokemon, pokeRogueMoveIds)

  if (allMoves.length === 0) {
    continue
  }

  mappedCount++

  // 分类招式
  const categorized = categorizeMoves(allMoves.map(m => m.moveId), pokeRogueMovesData)

  // 构建多套推荐
  const sets = buildRecommendationSets(allMoves, categorized, allMoves)

  if (sets.length > 0) {
    recommendations.set(pokemon.id, {
      sets,
      allMoves: allMoves.slice(0, 10), // 保留前10个用于调试
      stats: {
        totalSets: Object.values(smogonData_for_pokemon).reduce((sum, sets) => sum + Object.keys(sets).length, 0),
        totalFormats: Object.keys(smogonData_for_pokemon).length,
      }
    })
  }
}

console.log(`Generated recommendations for ${recommendations.size} Pokemon`)
console.log(`Pokemon with Smogon data: ${mappedCount}`)
console.log(`Unmapped moves: ${unmappedMoves.size}`)

// 保存推荐数据
fs.writeFileSync(
  path.join(DATA_DIR, 'smogon-recommendations.json'),
  JSON.stringify(Object.fromEntries(recommendations), null, 2)
)

console.log('Smogon recommendations saved to smogon-recommendations.json')
