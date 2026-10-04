# EveShipsProgression

> 🌐 Live version: <https://skybladev2.github.io/EveShipsProgression/>

Ship progression chart for EVE Online — from tech-1 frigates up to capital ships.
Corvettes, shuttles and Special Edition ships are not included.

Arrows lead from a base hull to its advanced, faction or pirate variants; the edge label names
the weapon system or role the source hull is bonused for (per the E-Uni wiki).

Click any ship to isolate its progression line: the chart is redrawn from just the ships
connected to it, directly or through a chain of variants, so what remains is laid out as a
compact diagram of its own. Click the background to bring the full chart back.

Click an edge to highlight that single connection — it only lights up the line and its label
and never changes what is shown, so it also works while a ship is isolated.

Hover an edge to see what it connects, in the form `edge label → connecting ship`; group
targets use their full path, e.g. `Missiles → Cruisers/Missiles`.

```mermaid
flowchart
	subgraph s1["Empire Faction Frigates"]
		subgraph s2["Missiles"]
			n_Kestrel["Kestrel"]
			n_Condor["Condor"]
			n_Breacher["Breacher"]
		end
		subgraph s3["Projectile turrets"]
			n_Slasher["Slasher"]
			n_Rifter["Rifter"]
		end
		subgraph s4["Hybrid turrets"]
			n_Merlin["Merlin"]
			n_Incursus["Incursus"]
			n_Atron["Atron"]
		end
		subgraph s5["Energy turrets"]
			n_Executioner["Executioner"]
			n_Punisher["Punisher"]
			n_Tormentor["Tormentor"]
		end
		subgraph s6["Drones"]
			n_Tristan["Tristan"]
		end
		subgraph s7["EWAR"]
			n_Crucifier["Crucifier"]
			n_Griffin["Griffin"]
			n_Maulus["Maulus"]
			n_Vigil["Vigil"]
		end
		subgraph s8["Scan"]
			n_Magnate["Magnate"]
			n_Heron["Heron"]
			n_Imicus["Imicus"]
			n_Probe["Probe"]
		end
		subgraph s9["Remote shield boost"]
			n_Burst["Burst"]
			n_Bantam["Bantam"]
		end
		subgraph s10["Remote armor repair"]
			n_Inquisitor["Inquisitor"]
			n_Navitas["Navitas"]
		end
		subgraph s11["Mining"]
			n_Venture["Venture"]
		end
	end
	subgraph s12["EDENCOM Frigates"]
		n_Skybreaker["Skybreaker"]
	end
	subgraph s13["Precursor Frigates"]
		n_Damavik["Damavik"]
	end
	subgraph s14["Expedition Frigates"]
		n_Endurance["Endurance"]
		n_Prospect["Prospect"]
	end
	subgraph s15["Cruisers"]
		subgraph c_missiles["Missiles"]
			n_Bellicose["Bellicose"]
			n_Caracal["Caracal"]
			n_Moa["Moa"]
		end
		subgraph c_proj["Projectile turrets"]
			n_Rupture["Rupture"]
			n_Stabber["Stabber"]
		end
		subgraph c_hybrid["Hybrid turrets"]
			n_Maller["Maller"]
			n_Thorax["Thorax"]
		end
		subgraph c_energy["Energy turrets"]
			n_Omen["Omen"]
		end
		subgraph c_drones["Drones"]
			n_Arbitrator["Arbitrator"]
			n_Vexor["Vexor"]
		end
		subgraph c_shield["Shield logistics"]
			n_Osprey["Osprey"]
			n_Scythe["Scythe"]
		end
		subgraph c_armor["Armor logistics"]
			n_Augoror["Augoror"]
			n_Exequror["Exequror"]
		end
		subgraph c_other["Other"]
			n_Blackbird["Blackbird"]
			n_Celestis["Celestis"]
			n_Phantom["Phantom"]
		end
	end
	subgraph s16["EDENCOM Cruisers"]
		n_Stormbringer["Stormbringer"]
	end
	subgraph s17["Precursor Cruisers"]
		n_Rodiva["Rodiva"]
		n_Vedmak["Vedmak"]
	end
	subgraph s18["Flag Cruiser"]
		n_Monitor["Monitor"]
	end
	subgraph s19["Battlecruiser"]
		subgraph bc_missiles["Missiles"]
			n_Cyclone["Cyclone"]
			n_Drake["Drake"]
			n_Naga["Naga"]
		end
		subgraph bc_proj["Projectile turrets"]
			n_Hurricane["Hurricane"]
			n_Tornado["Tornado"]
		end
		subgraph bc_hybrid["Hybrid turrets"]
			n_Brutix["Brutix"]
			n_Ferox["Ferox"]
			n_Talos["Talos"]
		end
		subgraph bc_energy["Energy turrets"]
			n_Harbinger["Harbinger"]
			n_Oracle["Oracle"]
			n_Prophecy["Prophecy"]
		end
		subgraph bc_drones["Drones"]
			n_Myrmidon["Myrmidon"]
		end
	end
	subgraph s20["Precursor Battlecruisers"]
		n_Drekavac["Drekavac"]
	end
	subgraph s21["Battleships"]
		subgraph bs_missiles["Missiles"]
			n_Raven["Raven"]
			n_Scorpion["Scorpion"]
			n_Typhoon["Typhoon"]
		end
		subgraph bs_proj["Projectile turrets"]
			n_Maelstrom["Maelstrom"]
			n_Tempest["Tempest"]
		end
		subgraph bs_hybrid["Hybrid turrets"]
			n_Hyperion["Hyperion"]
			n_Megathron["Megathron"]
			n_Rokh["Rokh"]
		end
		subgraph bs_energy["Energy turrets"]
			n_Abaddon["Abaddon"]
			n_Apocalypse["Apocalypse"]
			n_Armageddon["Armageddon"]
		end
		subgraph bs_drones["Drones"]
			n_Dominix["Dominix"]
		end
		subgraph bs_logi["Logistics"]
			n_Eidolon["Eidolon"]
		end
	end
	subgraph s22["EDENCOM Battleships"]
		n_Thunderchild["Thunderchild"]
	end
	subgraph s23["Precursor Battleships"]
		n_Leshak["Leshak"]
	end
	subgraph s24["Destroyers"]
		subgraph d_missiles["Missiles"]
			n_Corax["Corax"]
			n_Talwar["Talwar"]
		end
		subgraph d_drones["Drones"]
			n_Algos["Algos"]
			n_Dragoon["Dragoon"]
		end
		subgraph d_hybrid["Hybrid turrets"]
			n_Catalyst["Catalyst"]
			n_Cormorant["Cormorant"]
		end
		subgraph d_energy["Energy turrets"]
			n_Coercer["Coercer"]
		end
		subgraph d_proj["Projectile turrets"]
			n_Thrasher["Thrasher"]
		end
		subgraph d_mining["Mining"]
			n_Pioneer["Pioneer"]
		end
	end
	subgraph s25["Precursor Destroyers"]
		n_Kikimora["Kikimora"]
	end
	subgraph s26["Dreadnoughts"]
		n_Moros["Moros"]
		n_Naglfar["Naglfar"]
		n_Phoenix["Phoenix"]
		n_Revelation["Revelation"]
	end
	subgraph s27["Precursor Dreadnoughts"]
		n_Zirnitra["Zirnitra"]
	end
	subgraph s28["Titan"]
		n_Avatar["Avatar"]
		n_Erebus["Erebus"]
		n_Leviathan["Leviathan"]
		n_Ragnarok["Ragnarok"]
	end
	subgraph s29["Force Auxiliary"]
		n_Apostle["Apostle"]
		n_Lif["Lif"]
		n_Minokawa["Minokawa"]
		n_Ninazu["Ninazu"]
	end
	subgraph s30["Pirate Faction Force Auxiliaries"]
		n_Dagon["Dagon"]
		n_Loggerhead["Loggerhead"]
	end
	subgraph s31["Logistics Frigate"]
		subgraph s32["Remote shield boost"]
			n_Kirin["Kirin"]
			n_Scalpel["Scalpel"]
		end
		subgraph s33["Remote armor repair"]
			n_Deacon["Deacon"]
			n_Thalia["Thalia"]
		end
	end
	subgraph s34["Navy Faction Frigates"]
		subgraph s35["Missiles"]
			n_Caldari_Navy_Hookbill["Caldari Navy Hookbill"]
			n_Heron_Navy_Issue["Heron Navy Issue"]
			n_Probe_Fleet_Issue["Probe Fleet Issue"]
			n_Vigil_Fleet_Issue["Vigil Fleet Issue"]
		end
		subgraph s36["Energy turrets"]
			n_Crucifier_Navy_Issue["Crucifier Navy Issue"]
			n_Imperial_Navy_Slicer["Imperial Navy Slicer"]
		end
		subgraph s37["Hybrid turrets"]
			n_Federation_Navy_Comet["Federation Navy Comet"]
			n_Griffin_Navy_Issue["Griffin Navy Issue"]
		end
		subgraph s38["Scan"]
			n_Imicus_Navy_Issue["Imicus Navy Issue"]
			n_Magnate_Navy_Issue["Magnate Navy Issue"]
		end
		subgraph s39["Drones"]
			n_Maulus_Navy_Issue["Maulus Navy Issue"]
		end
		subgraph s40["Projectile turrets"]
			n_Republic_Fleet_Firetail["Republic Fleet Firetail"]
		end
		subgraph s41["Mining"]
			n_Venture_Consortium_Issue["Venture Consortium Issue"]
		end
	end
	subgraph s42["Interceptors"]
		n_Ares["Ares"]
		n_Claw["Claw"]
		n_Crow["Crow"]
		n_Crusader["Crusader"]
		n_Malediction["Malediction"]
		n_Raptor["Raptor"]
		n_Stiletto["Stiletto"]
		n_Taranis["Taranis"]
	end
	subgraph s43["Pirate Faction Frigates"]
		n_Astero["Astero"]
		n_Cruor["Cruor"]
		n_Daredevil["Daredevil"]
		n_Dramiel["Dramiel"]
		n_Garmur["Garmur"]
		n_Medusa["Medusa"]
		n_Succubus["Succubus"]
		n_Worm["Worm"]
	end
	subgraph s44["Assault Frigates"]
		n_Enyo["Enyo"]
		n_Harpy["Harpy"]
		n_Hawk["Hawk"]
		n_Ishkur["Ishkur"]
		n_Jaguar["Jaguar"]
		n_Nergal["Nergal"]
		n_Retribution["Retribution"]
		n_Vengeance["Vengeance"]
		n_Wolf["Wolf"]
	end
	subgraph s45["Covert Ops"]
		n_Anathema["Anathema"]
		n_Buzzard["Buzzard"]
		n_Cheetah["Cheetah"]
		n_Helios["Helios"]
		n_Hound["Hound"]
		n_Manticore["Manticore"]
		n_Nemesis["Nemesis"]
		n_Purifier["Purifier"]
	end
	subgraph s46["Electronic Attack Frigates"]
		n_Herald["Herald"]
		n_Hyena["Hyena"]
		n_Keres["Keres"]
		n_Kitsune["Kitsune"]
		n_Sentinel["Sentinel"]
	end
	subgraph s47["Haulers"]
		subgraph s48["Cargo"]
			n_Badger["Badger"]
			n_Bestower["Bestower"]
			n_Epithal["Epithal"]
			n_Hoarder["Hoarder"]
			n_Iteron_Mark_V["Iteron Mark V"]
			n_Kryos["Kryos"]
			n_Mammoth["Mammoth"]
			n_Miasmos["Miasmos"]
			n_Nereus["Nereus"]
			n_Sigil["Sigil"]
			n_Squall["Squall"]
			n_Tayra["Tayra"]
			n_Visitant["Visitant"]
			n_Wreathe["Wreathe"]
		end
		subgraph s49["Salvage"]
			n_Noctis["Noctis"]
		end
	end
	subgraph s50["Other Faction Frigates"]
		n_Metamorphosis["Metamorphosis"]
		n_Pacifier["Pacifier"]
	end
	subgraph s51["Navy Faction Destroyers"]
		subgraph nd_missiles["Missiles"]
			n_Corax_Navy_Issue["Corax Navy Issue"]
			n_Talwar_Fleet_Issue["Talwar Fleet Issue"]
		end
		subgraph nd_drones["Drones"]
			n_Algos_Navy_Issue["Algos Navy Issue"]
			n_Dragoon_Navy_Issue["Dragoon Navy Issue"]
		end
		subgraph nd_hybrid["Hybrid turrets"]
			n_Catalyst_Navy_Issue["Catalyst Navy Issue"]
			n_Cormorant_Navy_Issue["Cormorant Navy Issue"]
		end
		subgraph nd_energy["Energy turrets"]
			n_Coercer_Navy_Issue["Coercer Navy Issue"]
		end
		subgraph nd_proj["Projectile turrets"]
			n_Thrasher_Fleet_Issue["Thrasher Fleet Issue"]
		end
		subgraph nd_mining["Mining"]
			n_Pioneer_Consortium_Issue["Pioneer Consortium Issue"]
		end
	end
	subgraph s52["Interdictors"]
		n_Eris["Eris"]
		n_Flycatcher["Flycatcher"]
		n_Heretic["Heretic"]
		n_Sabre["Sabre"]
	end
	subgraph s53["Tactical Destroyers"]
		n_Confessor["Confessor"]
		n_Hecate["Hecate"]
		n_Jackdaw["Jackdaw"]
		n_Svipul["Svipul"]
	end
	subgraph s54["Pirate Faction Destroyers"]
		n_Mamba["Mamba"]
		n_Mekubal["Mekubal"]
		n_Tholos["Tholos"]
	end
	subgraph s55["Other Faction Destroyers"]
		n_Sunesis["Sunesis"]
	end
	subgraph s56["Command Destroyers"]
		n_Bifrost["Bifrost"]
		n_Draugur["Draugur"]
		n_Magus["Magus"]
		n_Outrider["Outrider"]
		n_Pontifex["Pontifex"]
		n_Stork["Stork"]
	end
	subgraph s57["Recon Ships"]
		n_Arazu["Arazu"]
		n_Curse["Curse"]
		n_Falcon["Falcon"]
		n_Huginn["Huginn"]
		n_Lachesis["Lachesis"]
		n_Penitence["Penitence"]
		n_Pilgrim["Pilgrim"]
		n_Rapier["Rapier"]
		n_Rook["Rook"]
	end
	subgraph s58["Navy Faction Cruisers"]
		subgraph nc_missiles["Missiles"]
			n_Caracal_Navy_Issue["Caracal Navy Issue"]
		end
		subgraph nc_proj["Projectile turrets"]
			n_Stabber_Fleet_Issue["Stabber Fleet Issue"]
		end
		subgraph nc_energy["Energy turrets"]
			n_Omen_Navy_Issue["Omen Navy Issue"]
		end
		subgraph nc_drones["Drones"]
			n_Vexor_Navy_Issue["Vexor Navy Issue"]
		end
		subgraph nc_shield["Shield logistics"]
			n_Osprey_Navy_Issue["Osprey Navy Issue"]
			n_Scythe_Fleet_Issue["Scythe Fleet Issue"]
		end
		subgraph nc_armor["Armor logistics"]
			n_Augoror_Navy_Issue["Augoror Navy Issue"]
			n_Exequror_Navy_Issue["Exeqor Navy Issue"]
		end
	end
	subgraph s59["Heavy Assault Cruisers"]
		n_Cerberus["Cerberus"]
		n_Deimos["Deimos"]
		n_Eagle["Eagle"]
		n_Ikitursa["Ikitursa"]
		n_Ishtar["Ishtar"]
		n_Muninn["Muninn"]
		n_Sacrilege["Sacrilege"]
		n_Vagabond["Vagabond"]
		n_Zealot["Zealot"]
	end
	subgraph s60["Strategic Cruisers"]
		n_Legion["Legion"]
		n_Loki["Loki"]
		n_Proteus["Proteus"]
		n_Tengu["Tengu"]
	end
	subgraph s61["Pirate Faction Cruisers"]
		n_Ashimmu["Ashimmu"]
		n_Cynabal["Cynabal"]
		n_Gila["Gila"]
		n_Ixion["Ixion"]
		n_Orthrus["Orthrus"]
		n_Phantasm["Phantasm"]
		n_Stratios["Stratios"]
		n_Vigilant["Vigilant"]
	end
	subgraph s62["Heavy Interdiction Cruisers"]
		n_Broadsword["Broadsword"]
		n_Devoter["Devoter"]
		n_Onyx["Onyx"]
		n_Phobos["Phobos"]
	end
	subgraph s63["Logistics Cruisers"]
		n_Basilisk["Basilisk"]
		n_Guardian["Guardian"]
		n_Oneiros["Oneiros"]
		n_Scimitar["Scimitar"]
		n_Zarmazd["Zarmazd"]
	end
	subgraph s64["Navy Faction Battlecruisers"]
		subgraph nbc_missiles["Missiles"]
			n_Cyclone_Fleet_Issue["Cyclone Fleet Issue"]
			n_Drake_Navy_Issue["Drake Navy Issue"]
		end
		subgraph nbc_proj["Projectile turrets"]
			n_Hurricane_Fleet_Issue["Hurricane Fleet Issue"]
		end
		subgraph nbc_hybrid["Hybrid turrets"]
			n_Brutix_Navy_Issue["Brutix Navy Issue"]
			n_Ferox_Navy_Issue["Ferox Navy Issue"]
		end
		subgraph nbc_energy["Energy turrets"]
			n_Harbinger_Navy_Issue["Harbinger Navy Issue"]
			n_Prophecy_Navy_Issue["Prophecy Navy Issue"]
		end
		subgraph nbc_drones["Drones"]
			n_Myrmidon_Navy_Issue["Myrmidon Navy Issue"]
		end
	end
	subgraph s65["Command ships"]
		n_Absolution["Absolution"]
		n_Astarte["Astarte"]
		n_Claymore["Claymore"]
		n_Damnation["Damnation"]
		n_Eos["Eos"]
		n_Nighthawk["Nighthawk"]
		n_Sleipnir["Sleipnir"]
		n_Vulture["Vulture"]
	end
	subgraph s66["Other Faction Battlecruisers"]
		n_Gnosis["Gnosis"]
	end
	subgraph s67["Pirate Faction Battlecruisers"]
		n_Alligator["Alligator"]
		n_Cenotaph["Cenotaph"]
		n_Khizriel["Khizriel"]
	end
	subgraph s68["Navy Faction Battleships"]
		subgraph nbs_missiles["Missiles"]
			n_Raven_Navy_Issue["Raven Navy Issue"]
			n_Scorpion_Navy_Issue["Scorpion Navy Issue"]
			n_Typhoon_Fleet_Issue["Typhoon Fleet Issue"]
		end
		subgraph nbs_proj["Projectile turrets"]
			n_Tempest_Fleet_Issue["Tempest Fleet Issue"]
		end
		subgraph nbs_hybrid["Hybrid turrets"]
			n_Megathron_Navy_Issue["Megathron Navy Issue"]
		end
		subgraph nbs_energy["Energy turrets"]
			n_Apocalypse_Navy_Issue["Apocalypse Navy Issue"]
			n_Armageddon_Navy_Issue["Armageddon Navy Issue"]
		end
		subgraph nbs_drones["Drones"]
			n_Dominix_Navy_Issue["Dominix Navy Issue"]
		end
	end
	subgraph s69["Black Ops"]
		n_Panther["Panther"]
		n_Redeemer["Redeemer"]
		n_Sin["Sin"]
		n_Widow["Widow"]
	end
	subgraph s70["Marauders"]
		n_Babaroga["Babaroga"]
		n_Golem["Golem"]
		n_Kronos["Kronos"]
		n_Paladin["Paladin"]
		n_Vargur["Vargur"]
	end
	subgraph s71["Pirate Faction Battleships"]
		n_Barghest["Barghest"]
		n_Bhaalgorn["Bhaalgorn"]
		n_Machariel["Machariel"]
		n_Nestor["Nestor"]
		n_Nightmare["Nightmare"]
		n_Rattlesnake["Rattlesnake"]
		n_Vindicator["Vindicator"]
	end
	subgraph s72["Other Faction Battleships"]
		n_Praxis["Praxis"]
	end
	subgraph s73["Navy Faction Dreadnoughts"]
		n_Moros_Navy_Issue["Moros Navy Issue"]
		n_Naglfar_Fleet_Issue["Naglfar Fleet Issue"]
		n_Phoenix_Navy_Issue["Phoenix Navy Issue"]
		n_Revelation_Navy_Issue["Revelation Navy Issue"]
	end
	subgraph s74["Lancer Dreadnoughts"]
		n_Bane["Bane"]
		n_Hubris["Hubris"]
		n_Karura["Karura"]
		n_Valravn["Valravn"]
	end
	subgraph s75["Pirate Faction Dreadnoughts"]
		n_Caiman["Caiman"]
		n_Chemosh["Chemosh"]
		n_Sarathiel["Sarathiel"]
		n_Vehement["Vehement"]
	end
	subgraph s76["Pirate Faction Titans"]
		n_Azariel["Azariel"]
		n_Komodo["Komodo"]
		n_Molok["Molok"]
		n_Vanquisher["Vanquisher"]
	end
	subgraph s77["Carriers"]
		n_Archon["Archon"]
		n_Chimera["Chimera"]
		n_Nidhoggur["Nidhoggur"]
		n_Thanatos["Thanatos"]
	end
	subgraph s78["Command carriers"]
		n_Gaia["Gaia"]
		n_Salvation["Salvation"]
		n_Simurgh["Simurgh"]
		n_Ymir["Ymir"]
	end
	subgraph s79["Supercarriers"]
		n_Aeon["Aeon"]
		n_Hel["Hel"]
		n_Nyx["Nyx"]
		n_Wyvern["Wyvern"]
	end
	subgraph s80["Pirate Faction Supercarriers"]
		n_Revenant["Revenant"]
		n_Vendetta["Vendetta"]
	end
	subgraph s81["Transport ships"]
		n_Bustard["Bustard"]
		n_Crane["Crane"]
		n_Deluge["Deluge"]
		n_Impel["Impel"]
		n_Mastodon["Mastodon"]
		n_Occator["Occator"]
		n_Prorator["Prorator"]
		n_Prowler["Prowler"]
		n_Torrent["Torrent"]
		n_Viator["Viator"]
	end
	subgraph s82["Freighters"]
		n_Avalanche["Avalanche"]
		n_Bowhead["Bowhead"]
		n_Charon["Charon"]
		n_Fenrir["Fenrir"]
		n_Obelisk["Obelisk"]
		n_Providence["Providence"]
	end
	subgraph s83["Jump Freighters"]
		n_Anshar["Anshar"]
		n_Ark["Ark"]
		n_Nomad["Nomad"]
		n_Rhea["Rhea"]
	end
	subgraph s84["Industrial Command Ships"]
		n_Orca["Orca"]
		n_Porpoise["Porpoise"]
	end
	subgraph s85["Capital Industrial Ships"]
		n_Rorqual["Rorqual"]
	end
	subgraph s86["Mining Barges"]
		n_Covetor["Covetor"]
		n_Procurer["Procurer"]
		n_Retriever["Retriever"]
	end
	subgraph s87["Exhumers"]
		n_Hulk["Hulk"]
		n_Mackinaw["Mackinaw"]
		n_Skiff["Skiff"]
	end
	subgraph s88["Expedition Command Ships"]
		n_Odysseus["Odysseus"]
	end
	n_Atron -->|"Hybrid turrets"| n_Ares
	n_Atron -->|"Hybrid turrets"| n_Taranis
	n_Breacher -->|"Missiles"| n_Jaguar
	n_Breacher -.->|"Missiles"| n_Hound
	n_Breacher -->|"Missiles"| n_Talwar
	n_Condor -->|"Missiles"| n_Crow
	n_Condor -->|"Missiles"| n_Raptor
	n_Condor -->|"Tackle"| s42
	n_Crucifier -->|"Weapon disruption"| n_Crucifier_Navy_Issue
	n_Crucifier -->|"Weapon disruption"| n_Herald
	n_Crucifier -->|"Weapon disruption"| n_Sentinel
	n_Executioner -->|"Energy turrets"| n_Crusader
	n_Executioner -->|"Energy turrets"| n_Malediction
	n_Executioner -->|"Energy turrets"| n_Coercer
	n_Griffin -->|"ECM"| n_Griffin_Navy_Issue
	n_Griffin -->|"ECM"| n_Kitsune
	n_Heron -->|"Scan"| n_Heron_Navy_Issue
	n_Heron -->|"Scan"| n_Buzzard
	n_Imicus -->|"Scan"| n_Helios
	n_Incursus -->|"Hybrid turrets"| n_Enyo
	n_Incursus -->|"Hybrid turrets"| n_Ishkur
	n_Incursus -->|"Hybrid turrets"| n_Catalyst
	n_Inquisitor -->|"Remote armor repair"| n_Purifier
	n_Kestrel -->|"Missiles"| n_Manticore
	n_Kestrel -->|"Missiles"| n_Corax
	n_Magnate -->|"Scan"| n_Anathema
	n_Maulus -->|"Sensor dampening"| n_Maulus_Navy_Issue
	n_Maulus -->|"Sensor dampening"| n_Keres
	n_Merlin -->|"Hybrid turrets"| n_Worm
	n_Merlin -->|"Hybrid turrets"| n_Harpy
	n_Merlin -->|"Hybrid turrets"| n_Hawk
	n_Merlin -->|"Hybrid turrets"| n_Cormorant
	n_Probe -->|"Scan"| n_Probe_Fleet_Issue
	n_Probe -->|"Scan"| n_Astero
	n_Probe -->|"Scan"| n_Cheetah
	n_Probe -->|"Cargo (ammo)"| n_Hoarder
	n_Probe -->|"Cargo"| n_Wreathe
	n_Probe -->|"Cargo"| n_Mammoth
	n_Punisher -->|"Energy turrets"| n_Retribution
	n_Punisher -->|"Energy turrets"| n_Vengeance
	n_Punisher -->|"Energy turrets"| n_Coercer
	n_Punisher -->|"Energy turrets"| n_Maller
	n_Rifter -->|"Projectile turrets"| n_Jaguar
	n_Rifter -->|"Projectile turrets"| n_Wolf
	n_Slasher -->|"Projectile turrets"| n_Claw
	n_Slasher -->|"Projectile turrets"| n_Stiletto
	n_Slasher -->|"Tackle"| s42
	n_Tormentor -->|"Energy turrets"| n_Dragoon
	n_Tristan -->|"Drones"| n_Nemesis
	n_Tristan -->|"Drones"| n_Algos
	n_Venture -->|"Mining"| n_Endurance
	n_Venture -->|"Mining"| n_Prospect
	n_Venture -->|"Mining"| n_Covetor
	n_Venture -->|"Mining"| n_Procurer
	n_Venture -->|"Mining"| n_Retriever
	n_Vigil -->|"Target paint"| n_Vigil_Fleet_Issue
	n_Vigil -->|"Target paint"| n_Hyena
	n_Vigil -->|"Target paint"| n_Bellicose
	n_Republic_Fleet_Firetail -->|"Projectile turrets, tackle"| n_Dramiel
	n_Vigil_Fleet_Issue -->|"Web range"| n_Cruor
	n_Vigil_Fleet_Issue -.->|"Missiles"| n_Garmur
	n_Vigil_Fleet_Issue -->|"Web range"| n_Huginn
	n_Astero -->|"Cloak, scan"| n_Cheetah
	n_Astero -->|"Scan"| n_Stratios
	n_Cruor -->|"Energy turrets"| n_Ashimmu
	n_Daredevil -->|"Hybrid turrets"| n_Vigilant
	n_Dramiel -->|"Projectile turrets"| n_Cynabal
	n_Garmur -->|"Missiles"| n_Orthrus
	n_Medusa -->|"Projectile turrets"| n_Ixion
	n_Succubus -->|"Energy turrets"| n_Phantasm
	n_Worm -->|"Missiles"| n_Mamba
	n_Skybreaker -->|"Vorton projector"| n_Stormbringer
	n_Damavik -->|"Entropic disintegrator"| n_Nergal
	n_Damavik -->|"Entropic disintegrator"| n_Kikimora
	n_Cheetah -->|"Cloak"| n_Prowler
	n_Algos -->|"Drones"| n_Magus
	n_Algos -->|"Drones"| n_Vexor
	n_Catalyst -->|"Hybrid turrets"| n_Eris
	n_Catalyst -->|"Hybrid turrets"| n_Hecate
	n_Catalyst -->|"Hybrid turrets"| n_Thorax
	n_Coercer -->|"Energy turrets"| n_Heretic
	n_Coercer -->|"Energy turrets"| n_Confessor
	n_Coercer -->|"Energy turrets"| n_Omen
	n_Corax -->|"Missiles"| n_Mamba
	n_Corax -->|"Missiles"| n_Stork
	n_Corax -->|"Missiles"| n_Jackdaw
	n_Corax -->|"Missiles"| n_Caracal
	n_Cormorant -->|"Hybrid turrets"| n_Flycatcher
	n_Cormorant -->|"Hybrid turrets"| n_Moa
	n_Dragoon -->|"Drones"| n_Pontifex
	n_Dragoon -->|"Drones"| n_Arbitrator
	n_Pioneer -->|"Mining"| n_Outrider
	n_Talwar -->|"Missiles"| n_Bifrost
	n_Talwar -->|"Missiles"| n_Bellicose
	n_Thrasher -->|"Projectile turrets"| n_Sabre
	n_Thrasher -->|"Projectile turrets"| n_Svipul
	n_Thrasher -->|"Projectile turrets"| n_Rupture
	n_Thrasher -->|"Projectile turrets"| n_Stabber
	n_Mamba -->|"Missiles"| n_Gila
	n_Mekubal -->|"Projectile turrets"| n_Khizriel
	n_Tholos -->|"Projectile turrets"| n_Cenotaph
	n_Kikimora -->|"Entropic disintegrator"| n_Draugur
	n_Kikimora -->|"Entropic disintegrator"| n_Rodiva
	n_Kikimora -->|"Entropic disintegrator"| n_Vedmak
	n_Bifrost -->|"Command bursts"| n_Claymore
	n_Arbitrator -->|"Drones"| n_Curse
	n_Arbitrator -->|"Drones"| n_Penitence
	n_Arbitrator -->|"Drones"| n_Pilgrim
	n_Arbitrator -->|"Drones"| n_Prophecy
	n_Augoror -->|"Remote armor repair"| n_Augoror_Navy_Issue
	n_Augoror -->|"Remote armor repair"| n_Guardian
	n_Bellicose -->|"Missiles"| n_Scythe_Fleet_Issue
	n_Bellicose -.->|"Missiles"| n_Orthrus
	n_Bellicose -->|"Missiles"| n_Muninn
	n_Bellicose -->|"Target paint"| n_Huginn
	n_Bellicose -->|"Missiles"| n_Rapier
	n_Bellicose -->|"HML and HAML rate of fire"| n_Cyclone
	n_Blackbird -->|"ECM"| n_Falcon
	n_Blackbird -->|"ECM"| n_Rook
	n_Caracal -->|"Missiles"| n_Caracal_Navy_Issue
	n_Caracal -->|"Missiles"| n_Cerberus
	n_Caracal -->|"Missiles"| n_Drake
	n_Celestis -->|"Sensor dampening"| n_Arazu
	n_Celestis -->|"Sensor dampening"| n_Lachesis
	n_Exequror -->|"Remote armor repair"| n_Exequror_Navy_Issue
	n_Exequror -->|"Remote armor repair"| n_Oneiros
	n_Maller -->|"Energy turrets"| n_Sacrilege
	n_Maller -->|"Energy turrets"| n_Devoter
	n_Maller -->|"Energy turrets"| n_Harbinger
	n_Moa -->|"Hybrid turrets"| n_Gila
	n_Moa -->|"Hybrid turrets"| n_Eagle
	n_Moa -->|"Hybrid turrets"| n_Onyx
	n_Moa -->|"Hybrid turrets"| n_Ferox
	n_Omen -->|"Energy turrets"| n_Omen_Navy_Issue
	n_Omen -->|"Energy turrets"| n_Zealot
	n_Omen -->|"Energy turrets"| n_Harbinger
	n_Osprey -->|"Remote shield boost"| n_Osprey_Navy_Issue
	n_Osprey -->|"Remote shield boost"| n_Basilisk
	n_Phantom -->|"Missiles"| n_Eidolon
	n_Rupture -->|"Projectile turrets"| n_Scythe_Fleet_Issue
	n_Rupture -->|"Projectile turrets"| n_Stabber_Fleet_Issue
	n_Rupture -->|"Projectile turrets"| n_Muninn
	n_Rupture -->|"Projectile turrets"| n_Vagabond
	n_Rupture -->|"Projectile turrets"| n_Huginn
	n_Rupture -->|"Projectile turrets"| n_Broadsword
	n_Rupture -->|"Projectile Turret damage"| n_Hurricane
	n_Scythe -->|"Remote shield boost"| n_Scythe_Fleet_Issue
	n_Scythe -->|"Remote shield boost, Logistic drones"| n_Scimitar
	n_Stabber -->|"Projectile turrets"| n_Rupture
	n_Stabber -->|"Projectile turrets"| n_Scythe_Fleet_Issue
	n_Stabber -->|"Projectile turrets"| n_Stabber_Fleet_Issue
	n_Stabber -->|"Projectile turrets"| n_Vagabond
	n_Stabber -->|"Projectile turrets"| n_Huginn
	n_Stabber -->|"Projectile turrets"| n_Broadsword
	n_Stabber -->|"Projectile turrets"| n_Hurricane
	n_Stabber -->|"Projectile turrets"| n_Tornado
	n_Thorax -->|"Hybrid turrets"| n_Vigilant
	n_Thorax -->|"Hybrid turrets"| n_Deimos
	n_Thorax -->|"Hybrid turrets"| n_Phobos
	n_Thorax -->|"Hybrid turrets"| n_Brutix
	n_Vexor -->|"Drones"| n_Vexor_Navy_Issue
	n_Vexor -->|"Drones"| n_Ishtar
	n_Vexor -->|"Drones"| n_Myrmidon
	n_Stabber_Fleet_Issue -->|"Projectile turrets"| n_Cynabal
	n_Stabber_Fleet_Issue -->|"Projectile turrets"| n_Loki
	n_Ashimmu -->|"Energy turrets"| n_Bhaalgorn
	n_Cynabal -->|"Projectile turrets"| n_Khizriel
	n_Gila -->|"Missiles"| n_Alligator
	n_Orthrus -->|"Missiles"| n_Barghest
	n_Phantasm -->|"Energy turrets"| n_Nightmare
	n_Stratios -->|"Scan"| n_Nestor
	n_Vigilant -->|"Hybrid turrets"| n_Vindicator
	n_Stormbringer -->|"Vorton projector"| n_Thunderchild
	n_Rodiva -->|"Remote armor repair"| n_Zarmazd
	n_Vedmak -->|"Entropic disintegrator"| n_Ikitursa
	n_Vedmak -->|"Entropic disintegrator"| n_Drekavac
	n_Cerberus -->|"Missiles"| n_Tengu
	n_Deimos -->|"Hybrid turrets"| n_Proteus
	n_Ishtar -->|"Drones"| n_Proteus
	n_Muninn -->|"Missiles"| n_Legion
	n_Muninn -->|"Missiles"| n_Loki
	n_Muninn -->|"Missiles"| n_Tengu
	n_Sacrilege -->|"Missiles"| n_Legion
	n_Vagabond -->|"Projectile turrets"| n_Loki
	n_Zealot -->|"Energy turrets"| n_Legion
	n_Broadsword -->|"Projectile turrets"| n_Loki
	n_Scimitar -->|"Remote shield boost, Logistic drones"| n_Lif
	n_Brutix -->|"Hybrid turrets"| n_Talos
	n_Brutix -->|"Hybrid turrets"| n_Brutix_Navy_Issue
	n_Brutix -->|"Hybrid turrets"| n_Astarte
	n_Brutix -->|"Hybrid turrets"| n_Hyperion
	n_Brutix -->|"Hybrid turrets"| n_Megathron
	n_Cyclone -->|"Missiles"| n_Cyclone_Fleet_Issue
	n_Cyclone -->|"Missiles"| n_Claymore
	n_Cyclone -->|"Missiles"| n_Typhoon
	n_Drake -->|"Missiles"| n_Drake_Navy_Issue
	n_Drake -->|"Missiles"| n_Alligator
	n_Drake -->|"Missiles"| n_Nighthawk
	n_Drake -->|"Missiles"| n_Raven
	n_Ferox -->|"Hybrid turrets"| n_Naga
	n_Ferox -->|"Hybrid turrets"| n_Ferox_Navy_Issue
	n_Ferox -->|"Hybrid turrets"| n_Vulture
	n_Ferox -->|"Hybrid turrets"| n_Rokh
	n_Harbinger -->|"Energy turrets"| n_Oracle
	n_Harbinger -->|"Energy turrets"| n_Harbinger_Navy_Issue
	n_Harbinger -->|"Energy turrets"| n_Absolution
	n_Harbinger -->|"Energy turrets"| n_Abaddon
	n_Harbinger -->|"Energy turrets"| n_Apocalypse
	n_Hurricane -->|"Projectile turrets"| n_Hurricane_Fleet_Issue
	n_Hurricane -->|"Projectile turrets"| n_Sleipnir
	n_Hurricane -->|"Projectile turrets"| n_Maelstrom
	n_Hurricane -->|"Projectile turrets"| n_Tempest
	n_Myrmidon -->|"Drones"| n_Myrmidon_Navy_Issue
	n_Myrmidon -->|"Drones"| n_Eos
	n_Myrmidon -->|"Drones"| n_Dominix
	n_Prophecy -->|"Drones"| n_Prophecy_Navy_Issue
	n_Prophecy -->|"Drones"| n_Damnation
	n_Prophecy -->|"Drones"| n_Armageddon
	n_Tornado -->|"Projectile turrets"| n_Maelstrom
	n_Tornado -->|"Projectile turrets"| n_Tempest
	n_Hurricane_Fleet_Issue -->|"Projectile turrets"| n_Khizriel
	n_Alligator -->|"Missiles"| n_Rattlesnake
	n_Khizriel -->|"Projectile turrets"| n_Machariel
	n_Drekavac -->|"Entropic disintegrator"| n_Leshak
	n_Claymore -->|"Command bursts"| n_Nidhoggur
	n_Apocalypse -->|"Energy turrets"| n_Apocalypse_Navy_Issue
	n_Apocalypse -->|"Energy turrets"| n_Paladin
	n_Apocalypse -->|"Energy turrets"| n_Revelation
	n_Armageddon -->|"Drones"| n_Armageddon_Navy_Issue
	n_Armageddon -->|"Drones"| n_Bhaalgorn
	n_Armageddon -->|"Drones"| n_Redeemer
	n_Dominix -->|"Drones"| n_Dominix_Navy_Issue
	n_Dominix -->|"Drones"| n_Sin
	n_Maelstrom -->|"Projectile turrets"| n_Tempest_Fleet_Issue
	n_Maelstrom -->|"Projectile turrets"| n_Typhoon_Fleet_Issue
	n_Maelstrom -->|"Projectile turrets"| n_Panther
	n_Maelstrom -->|"Projectile turrets"| n_Vargur
	n_Maelstrom -->|"Projectile turrets"| n_Naglfar
	n_Megathron -->|"Hybrid turrets"| n_Hyperion
	n_Megathron -->|"Hybrid turrets"| n_Megathron_Navy_Issue
	n_Megathron -->|"Hybrid turrets"| n_Vindicator
	n_Megathron -->|"Hybrid turrets"| n_Kronos
	n_Megathron -->|"Hybrid turrets"| n_Moros
	n_Raven -->|"Missiles"| n_Raven_Navy_Issue
	n_Raven -->|"Missiles"| n_Golem
	n_Raven -->|"Missiles"| n_Phoenix
	n_Scorpion -->|"ECM"| n_Scorpion_Navy_Issue
	n_Scorpion -->|"ECM"| n_Rattlesnake
	n_Scorpion -->|"ECM"| n_Widow
	n_Tempest -->|"Projectile turrets"| n_Maelstrom
	n_Tempest -->|"Projectile turrets"| n_Tempest_Fleet_Issue
	n_Tempest -->|"Projectile turrets"| n_Typhoon_Fleet_Issue
	n_Tempest -->|"Projectile turrets"| n_Panther
	n_Tempest -->|"Projectile turrets"| n_Vargur
	n_Tempest -->|"Projectile turrets"| n_Naglfar
	n_Typhoon -->|"Missiles"| n_Typhoon_Fleet_Issue
	n_Typhoon -.->|"Missiles"| n_Barghest
	n_Typhoon -->|"Missiles"| n_Panther
	n_Tempest_Fleet_Issue -->|"Projectile turrets"| n_Machariel
	n_Bhaalgorn -->|"Energy turrets"| n_Chemosh
	n_Machariel -->|"Projectile turrets"| n_Sarathiel
	n_Nestor -->|"Drones"| n_Odysseus
	n_Nightmare -->|"Energy turrets"| n_Revenant
	n_Rattlesnake -->|"Missiles"| n_Caiman
	n_Vindicator -->|"Hybrid turrets"| n_Vehement
	n_Leshak -->|"Entropic disintegrator"| n_Babaroga
	n_Leshak -->|"Entropic disintegrator"| n_Zirnitra
	n_Moros -->|"Capital hybrid turrets"| n_Moros_Navy_Issue
	n_Moros -->|"Capital hybrid turrets"| n_Hubris
	n_Moros -->|"Capital hybrid turrets"| n_Vehement
	n_Moros -->|"Capital hybrid turrets"| n_Erebus
	n_Naglfar -->|"Projectile turrets"| n_Naglfar_Fleet_Issue
	n_Naglfar -->|"Projectile turrets"| n_Valravn
	n_Naglfar -->|"Projectile Turret damage"| n_Ragnarok
	n_Phoenix -->|"Capital missiles"| n_Phoenix_Navy_Issue
	n_Phoenix -->|"Capital missiles"| n_Karura
	n_Phoenix -->|"Capital missiles"| n_Caiman
	n_Phoenix -->|"Capital missiles"| n_Leviathan
	n_Revelation -->|"Capital energy turrets"| n_Revelation_Navy_Issue
	n_Revelation -->|"Capital energy turrets"| n_Bane
	n_Revelation -->|"Capital energy turrets"| n_Chemosh
	n_Revelation -->|"Capital energy turrets"| n_Avatar
	n_Naglfar_Fleet_Issue -->|"Projectile turrets"| n_Sarathiel
	n_Caiman -->|"Capital missiles"| n_Komodo
	n_Caiman -->|"Capital missiles"| n_Loggerhead
	n_Chemosh -->|"Capital energy turrets"| n_Molok
	n_Chemosh -->|"Capital energy turrets"| n_Dagon
	n_Sarathiel -->|"Projectile turrets"| n_Azariel
	n_Vehement -->|"Capital hybrid turrets"| n_Vanquisher
	n_Archon -->|"Fighters, Command bursts"| n_Salvation
	n_Archon -->|"Fighters"| n_Aeon
	n_Archon -->|"Capital remote repair"| n_Apostle
	n_Chimera -->|"Fighters, Command bursts"| n_Simurgh
	n_Chimera -->|"Fighters"| n_Wyvern
	n_Chimera -->|"Capital remote repair"| n_Minokawa
	n_Nidhoggur -->|"Fighters, Command bursts"| n_Ymir
	n_Nidhoggur -->|"Fighters, Command bursts"| n_Hel
	n_Nidhoggur -->|"Capital remote repair"| n_Lif
	n_Thanatos -->|"Fighters, Command bursts"| n_Gaia
	n_Thanatos -->|"Fighters"| n_Nyx
	n_Thanatos -->|"Capital remote repair"| n_Ninazu
	n_Hel -->|"Fighters, Command bursts"| n_Revenant
	n_Hel -->|"Fighters, Command bursts"| n_Vendetta
	n_Avatar -->|"Capital energy turrets"| n_Molok
	n_Erebus -->|"Capital hybrid turrets"| n_Vanquisher
	n_Leviathan -->|"Capital missiles"| n_Komodo
	n_Badger -->|"Cargo"| n_Bustard
	n_Badger -->|"Cargo"| n_Crane
	n_Badger -->|"Cargo"| n_Charon
	n_Bestower -->|"Cargo"| n_Impel
	n_Bestower -->|"Cargo"| n_Prorator
	n_Bestower -->|"Cargo"| n_Providence
	n_Deluge -->|"Cargo"| n_Avalanche
	n_Epithal -->|"Cargo"| n_Occator
	n_Iteron_Mark_V -->|"Cargo"| n_Occator
	n_Iteron_Mark_V -->|"Cargo"| n_Viator
	n_Iteron_Mark_V -->|"Cargo"| n_Obelisk
	n_Kryos -->|"Cargo"| n_Viator
	n_Mammoth -->|"Cargo"| n_Mastodon
	n_Mammoth -->|"Cargo"| n_Prowler
	n_Mammoth -->|"Cargo"| n_Fenrir
	n_Miasmos -->|"Cargo"| n_Occator
	n_Nereus -->|"Cargo"| n_Occator
	n_Nereus -->|"Cargo"| n_Viator
	n_Nereus -->|"Cargo"| n_Obelisk
	n_Noctis -->|"Salvage"| n_Porpoise
	n_Sigil -->|"Cargo"| n_Prorator
	n_Sigil -->|"Cargo"| n_Providence
	n_Squall -->|"Cargo"| n_Deluge
	n_Squall -->|"Cargo"| n_Torrent
	n_Tayra -->|"Cargo"| n_Bustard
	n_Tayra -->|"Cargo"| n_Charon
	n_Torrent -->|"Cargo"| n_Avalanche
	n_Wreathe -->|"Cargo"| n_Prowler
	n_Wreathe -->|"Cargo"| n_Fenrir
	n_Charon -->|"Cargo"| n_Rhea
	n_Fenrir -->|"Cargo"| n_Nomad
	n_Obelisk -->|"Cargo"| n_Anshar
	n_Providence -->|"Cargo"| n_Ark
	n_Orca -->|"Mining foreman bursts"| n_Rorqual
	n_Porpoise -->|"Mining foreman bursts"| n_Orca
	n_Covetor -->|"Mining"| n_Hulk
	n_Procurer -->|"Mining"| n_Skiff
	n_Retriever -->|"Mining"| n_Mackinaw
	n_Metamorphosis -->|"Scan"| n_Probe
	n_Probe -->|"Scan"| n_Metamorphosis
	n_Metamorphosis -->|"Cloak, scan"| n_Astero
	n_Cheetah -->|"Cloak, scan"| n_Pacifier
	n_Probe -->|"Cargo"| n_Sunesis
	n_Sunesis -->|"Missiles"| n_Talwar
	n_Sunesis -->|"Projectile turrets"| n_Thrasher
	n_Gnosis -->|"Missiles"| n_Cyclone
	n_Gnosis -->|"Projectile turrets"| n_Hurricane
	n_Praxis -->|"Missiles"| n_Typhoon
	n_Praxis -->|"Projectile turrets"| n_Maelstrom
	n_Praxis -->|"Projectile turrets"| n_Tempest
	n_Probe_Fleet_Issue -->|"Missiles, scan"| n_Pacifier
	s2 ==>|"Missiles"| s35
	s3 ==>|"Projectile turrets"| s40
	s4 ==>|"Hybrid turrets"| s37
	s5 ==>|"Energy turrets"| s36
	s6 ==>|"Drones"| s39
	s8 ==>|"Scan"| s38
	s11 ==>|"Mining"| s41
	s9 ==>|"Remote shield boost"| s32
	s10 ==>|"Remote armor repair"| s33
	d_missiles ==>|"Missiles"| nd_missiles
	d_drones ==>|"Drones"| nd_drones
	d_hybrid ==>|"Hybrid turrets"| nd_hybrid
	d_energy ==>|"Energy turrets"| nd_energy
	d_proj ==>|"Projectile turrets"| nd_proj
	d_mining ==>|"Mining"| nd_mining
	c_missiles ==>|"Missiles"| nc_missiles
	c_proj ==>|"Projectile turrets"| nc_proj
	c_energy ==>|"Energy turrets"| nc_energy
	c_drones ==>|"Drones"| nc_drones
	c_shield ==>|"Shield logistics"| nc_shield
	c_armor ==>|"Armor logistics"| nc_armor
	bc_missiles ==>|"Missiles"| nbc_missiles
	bc_proj ==>|"Projectile turrets"| nbc_proj
	bc_hybrid ==>|"Hybrid turrets"| nbc_hybrid
	bc_energy ==>|"Energy turrets"| nbc_energy
	bc_drones ==>|"Drones"| nbc_drones
	bs_missiles ==>|"Missiles"| nbs_missiles
	bs_proj ==>|"Projectile turrets"| nbs_proj
	bs_hybrid ==>|"Hybrid turrets"| nbs_hybrid
	bs_energy ==>|"Energy turrets"| nbs_energy
	bs_drones ==>|"Drones"| nbs_drones
```
