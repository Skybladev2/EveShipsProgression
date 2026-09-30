# EveShipsProgression

Ship progression chart for EVE Online — from tech-1 frigates up to capital ships.
Corvettes, shuttles and Special Edition ships are not included.

Arrows lead from a base hull to its advanced, faction or pirate variants; the edge label names
the weapon system or role the source hull is bonused for (per the E-Uni wiki).

```mermaid
flowchart
	subgraph s_Standard_Frigates["Standard Frigates"]
		n_Atron["Atron"]
		n_Bantam["Bantam"]
		n_Breacher["Breacher"]
		n_Burst["Burst"]
		n_Condor["Condor"]
		n_Crucifier["Crucifier"]
		n_Executioner["Executioner"]
		n_Griffin["Griffin"]
		n_Heron["Heron"]
		n_Imicus["Imicus"]
		n_Incursus["Incursus"]
		n_Inquisitor["Inquisitor"]
		n_Kestrel["Kestrel"]
		n_Magnate["Magnate"]
		n_Maulus["Maulus"]
		n_Merlin["Merlin"]
		n_Navitas["Navitas"]
		n_Probe["Probe"]
		n_Punisher["Punisher"]
		n_Rifter["Rifter"]
		n_Slasher["Slasher"]
		n_Specter["Specter"]
		n_Tormentor["Tormentor"]
		n_Tristan["Tristan"]
		n_Venture["Venture"]
		n_Vigil["Vigil"]
		n_Wraith["Wraith"]
	end
	subgraph s_Faction_Frigates["Faction Frigates"]
		n_Caldari_Navy_Hookbill["Caldari Navy Hookbill"]
		n_Crucifier_Navy_Issue["Crucifier Navy Issue"]
		n_Federation_Navy_Comet["Federation Navy Comet"]
		n_Griffin_Navy_Issue["Griffin Navy Issue"]
		n_Heron_Navy_Issue["Heron Navy Issue"]
		n_Imicus_Navy_Issue["Imicus Navy Issue"]
		n_Imperial_Navy_Slicer["Imperial Navy Slicer"]
		n_Magnate_Navy_Issue["Magnate Navy Issue"]
		n_Maulus_Navy_Issue["Maulus Navy Issue"]
		n_Probe_Fleet_Issue["Probe Fleet Issue"]
		n_Republic_Fleet_Firetail["Republic Fleet Firetail"]
		n_Venture_Consortium_Issue["Venture Consortium Issue"]
		n_Vigil_Fleet_Issue["Vigil Fleet Issue"]
	end
	subgraph s_Pirate_Faction_Frigates["Pirate Faction Frigates"]
		n_Astero["Astero"]
		n_Cruor["Cruor"]
		n_Daredevil["Daredevil"]
		n_Dramiel["Dramiel"]
		n_Garmur["Garmur"]
		n_Medusa["Medusa"]
		n_Succubus["Succubus"]
		n_Worm["Worm"]
	end
	subgraph s_EDENCOM_Frigates["EDENCOM Frigates"]
		n_Skybreaker["Skybreaker"]
	end
	subgraph s_Precursor_Frigates["Precursor Frigates"]
		n_Damavik["Damavik"]
	end
	subgraph s_Assault_Frigates["Assault Frigates"]
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
	subgraph s_Covert_Ops["Covert Ops"]
		n_Anathema["Anathema"]
		n_Buzzard["Buzzard"]
		n_Cheetah["Cheetah"]
		n_Helios["Helios"]
		n_Hound["Hound"]
		n_Manticore["Manticore"]
		n_Nemesis["Nemesis"]
		n_Purifier["Purifier"]
	end
	subgraph s_Electronic_Attack_Frigates["Electronic Attack Frigates"]
		n_Herald["Herald"]
		n_Hyena["Hyena"]
		n_Keres["Keres"]
		n_Kitsune["Kitsune"]
		n_Sentinel["Sentinel"]
	end
	subgraph s_Interceptors["Interceptors"]
		n_Ares["Ares"]
		n_Claw["Claw"]
		n_Crow["Crow"]
		n_Crusader["Crusader"]
		n_Malediction["Malediction"]
		n_Raptor["Raptor"]
		n_Stiletto["Stiletto"]
		n_Taranis["Taranis"]
	end
	subgraph s_Logistics_Frigates["Logistics Frigates"]
		n_Deacon["Deacon"]
		n_Kirin["Kirin"]
		n_Scalpel["Scalpel"]
		n_Thalia["Thalia"]
	end
	subgraph s_Expedition_Frigates["Expedition Frigates"]
		n_Endurance["Endurance"]
		n_Prospect["Prospect"]
	end
	subgraph s_Standard_Destroyers["Standard Destroyers"]
		n_Algos["Algos"]
		n_Catalyst["Catalyst"]
		n_Coercer["Coercer"]
		n_Corax["Corax"]
		n_Cormorant["Cormorant"]
		n_Dragoon["Dragoon"]
		n_Pioneer["Pioneer"]
		n_Talwar["Talwar"]
		n_Thrasher["Thrasher"]
	end
	subgraph s_Faction_Destroyers["Faction Destroyers"]
		n_Algos_Navy_Issue["Algos Navy Issue"]
		n_Catalyst_Navy_Issue["Catalyst Navy Issue"]
		n_Coercer_Navy_Issue["Coercer Navy Issue"]
		n_Corax_Navy_Issue["Corax Navy Issue"]
		n_Cormorant_Navy_Issue["Cormorant Navy Issue"]
		n_Dragoon_Navy_Issue["Dragoon Navy Issue"]
		n_Pioneer_Consortium_Issue["Pioneer Consortium Issue"]
		n_Talwar_Fleet_Issue["Talwar Fleet Issue"]
		n_Thrasher_Fleet_Issue["Thrasher Fleet Issue"]
	end
	subgraph s_Pirate_Faction_Destroyers["Pirate Faction Destroyers"]
		n_Mamba["Mamba"]
		n_Mekubal["Mekubal"]
		n_Tholos["Tholos"]
	end
	subgraph s_Precursor_Destroyers["Precursor Destroyers"]
		n_Kikimora["Kikimora"]
	end
	subgraph s_Interdictors["Interdictors"]
		n_Eris["Eris"]
		n_Flycatcher["Flycatcher"]
		n_Heretic["Heretic"]
		n_Sabre["Sabre"]
	end
	subgraph s_Command_Destroyers["Command Destroyers"]
		n_Bifrost["Bifrost"]
		n_Draugur["Draugur"]
		n_Magus["Magus"]
		n_Outrider["Outrider"]
		n_Pontifex["Pontifex"]
		n_Stork["Stork"]
	end
	subgraph s_Tactical_Destroyers["Tactical Destroyers"]
		n_Confessor["Confessor"]
		n_Hecate["Hecate"]
		n_Jackdaw["Jackdaw"]
		n_Svipul["Svipul"]
	end
	subgraph s_Standard_Cruisers["Standard Cruisers"]
		n_Arbitrator["Arbitrator"]
		n_Augoror["Augoror"]
		n_Bellicose["Bellicose"]
		n_Blackbird["Blackbird"]
		n_Caracal["Caracal"]
		n_Celestis["Celestis"]
		n_Exequror["Exequror"]
		n_Maller["Maller"]
		n_Moa["Moa"]
		n_Omen["Omen"]
		n_Osprey["Osprey"]
		n_Phantom["Phantom"]
		n_Rupture["Rupture"]
		n_Scythe["Scythe"]
		n_Stabber["Stabber"]
		n_Thorax["Thorax"]
		n_Vexor["Vexor"]
	end
	subgraph s_Faction_Cruisers["Faction Cruisers"]
		n_Augoror_Navy_Issue["Augoror Navy Issue"]
		n_Caracal_Navy_Issue["Caracal Navy Issue"]
		n_Exequror_Navy_Issue["Exequror Navy Issue"]
		n_Omen_Navy_Issue["Omen Navy Issue"]
		n_Osprey_Navy_Issue["Osprey Navy Issue"]
		n_Scythe_Fleet_Issue["Scythe Fleet Issue"]
		n_Stabber_Fleet_Issue["Stabber Fleet Issue"]
		n_Vexor_Navy_Issue["Vexor Navy Issue"]
	end
	subgraph s_Pirate_Faction_Cruisers["Pirate Faction Cruisers"]
		n_Ashimmu["Ashimmu"]
		n_Cynabal["Cynabal"]
		n_Gila["Gila"]
		n_Ixion["Ixion"]
		n_Orthrus["Orthrus"]
		n_Phantasm["Phantasm"]
		n_Stratios["Stratios"]
		n_Vigilant["Vigilant"]
	end
	subgraph s_EDENCOM_Cruisers["EDENCOM Cruisers"]
		n_Stormbringer["Stormbringer"]
	end
	subgraph s_Precursor_Cruisers["Precursor Cruisers"]
		n_Rodiva["Rodiva"]
		n_Vedmak["Vedmak"]
	end
	subgraph s_Heavy_Assault_Cruisers["Heavy Assault Cruisers"]
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
	subgraph s_Recon_Ships["Recon Ships"]
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
	subgraph s_Heavy_Interdiction_Cruisers["Heavy Interdiction Cruisers"]
		n_Broadsword["Broadsword"]
		n_Devoter["Devoter"]
		n_Onyx["Onyx"]
		n_Phobos["Phobos"]
	end
	subgraph s_Logistics_Cruisers["Logistics Cruisers"]
		n_Basilisk["Basilisk"]
		n_Guardian["Guardian"]
		n_Oneiros["Oneiros"]
		n_Scimitar["Scimitar"]
		n_Zarmazd["Zarmazd"]
	end
	subgraph s_Strategic_Cruisers["Strategic Cruisers"]
		n_Legion["Legion"]
		n_Loki["Loki"]
		n_Proteus["Proteus"]
		n_Tengu["Tengu"]
	end
	subgraph s_Flag_Cruiser["Flag Cruiser"]
		n_Monitor["Monitor"]
	end
	subgraph s_Standard_Battlecruisers["Standard Battlecruisers"]
		n_Brutix["Brutix"]
		n_Cyclone["Cyclone"]
		n_Drake["Drake"]
		n_Ferox["Ferox"]
		n_Harbinger["Harbinger"]
		n_Hurricane["Hurricane"]
		n_Myrmidon["Myrmidon"]
		n_Naga["Naga"]
		n_Oracle["Oracle"]
		n_Prophecy["Prophecy"]
		n_Talos["Talos"]
		n_Tornado["Tornado"]
	end
	subgraph s_Faction_Battlecruisers["Faction Battlecruisers"]
		n_Brutix_Navy_Issue["Brutix Navy Issue"]
		n_Cyclone_Fleet_Issue["Cyclone Fleet Issue"]
		n_Drake_Navy_Issue["Drake Navy Issue"]
		n_Ferox_Navy_Issue["Ferox Navy Issue"]
		n_Harbinger_Navy_Issue["Harbinger Navy Issue"]
		n_Hurricane_Fleet_Issue["Hurricane Fleet Issue"]
		n_Myrmidon_Navy_Issue["Myrmidon Navy Issue"]
		n_Prophecy_Navy_Issue["Prophecy Navy Issue"]
	end
	subgraph s_Pirate_Faction_Battlecruisers["Pirate Faction Battlecruisers"]
		n_Alligator["Alligator"]
		n_Cenotaph["Cenotaph"]
		n_Khizriel["Khizriel"]
	end
	subgraph s_Precursor_Battlecruisers["Precursor Battlecruisers"]
		n_Drekavac["Drekavac"]
	end
	subgraph s_Command_Ships["Command Ships"]
		n_Absolution["Absolution"]
		n_Astarte["Astarte"]
		n_Claymore["Claymore"]
		n_Damnation["Damnation"]
		n_Eos["Eos"]
		n_Nighthawk["Nighthawk"]
		n_Sleipnir["Sleipnir"]
		n_Vulture["Vulture"]
	end
	subgraph s_Standard_Battleships["Standard Battleships"]
		n_Abaddon["Abaddon"]
		n_Apocalypse["Apocalypse"]
		n_Armageddon["Armageddon"]
		n_Dominix["Dominix"]
		n_Eidolon["Eidolon"]
		n_Hyperion["Hyperion"]
		n_Maelstrom["Maelstrom"]
		n_Megathron["Megathron"]
		n_Raven["Raven"]
		n_Rokh["Rokh"]
		n_Scorpion["Scorpion"]
		n_Tempest["Tempest"]
		n_Typhoon["Typhoon"]
	end
	subgraph s_Faction_Battleships["Faction Battleships"]
		n_Apocalypse_Navy_Issue["Apocalypse Navy Issue"]
		n_Armageddon_Navy_Issue["Armageddon Navy Issue"]
		n_Dominix_Navy_Issue["Dominix Navy Issue"]
		n_Megathron_Navy_Issue["Megathron Navy Issue"]
		n_Raven_Navy_Issue["Raven Navy Issue"]
		n_Scorpion_Navy_Issue["Scorpion Navy Issue"]
		n_Tempest_Fleet_Issue["Tempest Fleet Issue"]
		n_Typhoon_Fleet_Issue["Typhoon Fleet Issue"]
	end
	subgraph s_Pirate_Faction_Battleships["Pirate Faction Battleships"]
		n_Barghest["Barghest"]
		n_Bhaalgorn["Bhaalgorn"]
		n_Machariel["Machariel"]
		n_Nestor["Nestor"]
		n_Nightmare["Nightmare"]
		n_Rattlesnake["Rattlesnake"]
		n_Vindicator["Vindicator"]
	end
	subgraph s_EDENCOM_Battleships["EDENCOM Battleships"]
		n_Thunderchild["Thunderchild"]
	end
	subgraph s_Precursor_Battleships["Precursor Battleships"]
		n_Leshak["Leshak"]
	end
	subgraph s_Black_Ops["Black Ops"]
		n_Panther["Panther"]
		n_Redeemer["Redeemer"]
		n_Sin["Sin"]
		n_Widow["Widow"]
	end
	subgraph s_Marauders["Marauders"]
		n_Babaroga["Babaroga"]
		n_Golem["Golem"]
		n_Kronos["Kronos"]
		n_Paladin["Paladin"]
		n_Vargur["Vargur"]
	end
	subgraph s_Dreadnoughts["Dreadnoughts"]
		n_Moros["Moros"]
		n_Naglfar["Naglfar"]
		n_Phoenix["Phoenix"]
		n_Revelation["Revelation"]
	end
	subgraph s_Faction_Dreadnoughts["Faction Dreadnoughts"]
		n_Moros_Navy_Issue["Moros Navy Issue"]
		n_Naglfar_Fleet_Issue["Naglfar Fleet Issue"]
		n_Phoenix_Navy_Issue["Phoenix Navy Issue"]
		n_Revelation_Navy_Issue["Revelation Navy Issue"]
	end
	subgraph s_Lancer_Dreadnoughts["Lancer Dreadnoughts"]
		n_Bane["Bane"]
		n_Hubris["Hubris"]
		n_Karura["Karura"]
		n_Valravn["Valravn"]
	end
	subgraph s_Pirate_Faction_Dreadnoughts["Pirate Faction Dreadnoughts"]
		n_Caiman["Caiman"]
		n_Chemosh["Chemosh"]
		n_Sarathiel["Sarathiel"]
		n_Vehement["Vehement"]
	end
	subgraph s_Precursor_Dreadnoughts["Precursor Dreadnoughts"]
		n_Zirnitra["Zirnitra"]
	end
	subgraph s_Carriers["Carriers"]
		n_Archon["Archon"]
		n_Chimera["Chimera"]
		n_Nidhoggur["Nidhoggur"]
		n_Thanatos["Thanatos"]
	end
	subgraph s_Command_Carriers["Command Carriers"]
		n_Gaia["Gaia"]
		n_Salvation["Salvation"]
		n_Simurgh["Simurgh"]
		n_Ymir["Ymir"]
	end
	subgraph s_Supercarriers["Supercarriers"]
		n_Aeon["Aeon"]
		n_Hel["Hel"]
		n_Nyx["Nyx"]
		n_Wyvern["Wyvern"]
	end
	subgraph s_Pirate_Faction_Supercarriers["Pirate Faction Supercarriers"]
		n_Revenant["Revenant"]
		n_Vendetta["Vendetta"]
	end
	subgraph s_Titans["Titans"]
		n_Avatar["Avatar"]
		n_Erebus["Erebus"]
		n_Leviathan["Leviathan"]
		n_Ragnarok["Ragnarok"]
	end
	subgraph s_Pirate_Faction_Titans["Pirate Faction Titans"]
		n_Azariel["Azariel"]
		n_Komodo["Komodo"]
		n_Molok["Molok"]
		n_Vanquisher["Vanquisher"]
	end
	subgraph s_Force_Auxiliaries["Force Auxiliaries"]
		n_Apostle["Apostle"]
		n_Lif["Lif"]
		n_Minokawa["Minokawa"]
		n_Ninazu["Ninazu"]
	end
	subgraph s_Pirate_Faction_Force_Auxiliaries["Pirate Faction Force Auxiliaries"]
		n_Dagon["Dagon"]
		n_Loggerhead["Loggerhead"]
	end
	subgraph s_Haulers["Haulers"]
		n_Badger["Badger"]
		n_Bestower["Bestower"]
		n_Epithal["Epithal"]
		n_Hoarder["Hoarder"]
		n_Iteron_Mark_V["Iteron Mark V"]
		n_Kryos["Kryos"]
		n_Mammoth["Mammoth"]
		n_Miasmos["Miasmos"]
		n_Nereus["Nereus"]
		n_Noctis["Noctis"]
		n_Sigil["Sigil"]
		n_Squall["Squall"]
		n_Tayra["Tayra"]
		n_Visitant["Visitant"]
		n_Wreathe["Wreathe"]
	end
	subgraph s_Transport_Ships["Transport Ships"]
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
	subgraph s_Freighters["Freighters"]
		n_Avalanche["Avalanche"]
		n_Bowhead["Bowhead"]
		n_Charon["Charon"]
		n_Fenrir["Fenrir"]
		n_Obelisk["Obelisk"]
		n_Providence["Providence"]
	end
	subgraph s_Jump_Freighters["Jump Freighters"]
		n_Anshar["Anshar"]
		n_Ark["Ark"]
		n_Nomad["Nomad"]
		n_Rhea["Rhea"]
	end
	subgraph s_Industrial_Command_Ships["Industrial Command Ships"]
		n_Orca["Orca"]
		n_Porpoise["Porpoise"]
	end
	subgraph s_Capital_Industrial_Ships["Capital Industrial Ships"]
		n_Rorqual["Rorqual"]
	end
	subgraph s_Mining_Barges["Mining Barges"]
		n_Covetor["Covetor"]
		n_Procurer["Procurer"]
		n_Retriever["Retriever"]
	end
	subgraph s_Exhumers["Exhumers"]
		n_Hulk["Hulk"]
		n_Mackinaw["Mackinaw"]
		n_Skiff["Skiff"]
	end
	subgraph s_Expedition_Command_Ships["Expedition Command Ships"]
		n_Odysseus["Odysseus"]
	end
	n_Atron -->|"Hybrid turrets"| n_Ares
	n_Atron -->|"Hybrid turrets"| n_Taranis
	n_Bantam -->|"Remote shield boost"| n_Kirin
	n_Breacher -->|"Missiles"| n_Jaguar
	n_Breacher -->|"Missiles"| n_Hound
	n_Breacher -->|"Missiles"| n_Talwar
	n_Burst -->|"Remote shield boost"| n_Scalpel
	n_Condor -->|"Missiles"| n_Crow
	n_Condor -->|"Missiles"| n_Raptor
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
	n_Imicus -->|"Scan"| n_Imicus_Navy_Issue
	n_Imicus -->|"Scan"| n_Helios
	n_Incursus -->|"Hybrid turrets"| n_Federation_Navy_Comet
	n_Incursus -->|"Hybrid turrets"| n_Enyo
	n_Incursus -->|"Hybrid turrets"| n_Ishkur
	n_Incursus -->|"Hybrid turrets"| n_Catalyst
	n_Inquisitor -->|"Remote armor repair"| n_Purifier
	n_Inquisitor -->|"Remote armor repair"| n_Deacon
	n_Kestrel -->|"Missiles"| n_Caldari_Navy_Hookbill
	n_Kestrel -->|"Missiles"| n_Manticore
	n_Kestrel -->|"Missiles"| n_Corax
	n_Magnate -->|"Scan"| n_Magnate_Navy_Issue
	n_Magnate -->|"Scan"| n_Anathema
	n_Maulus -->|"Sensor dampening"| n_Maulus_Navy_Issue
	n_Maulus -->|"Sensor dampening"| n_Keres
	n_Merlin -->|"Hybrid turrets"| n_Worm
	n_Merlin -->|"Hybrid turrets"| n_Harpy
	n_Merlin -->|"Hybrid turrets"| n_Hawk
	n_Merlin -->|"Hybrid turrets"| n_Cormorant
	n_Navitas -->|"Remote armor repair"| n_Thalia
	n_Probe -->|"Scan"| n_Probe_Fleet_Issue
	n_Probe -->|"Scan"| n_Astero
	n_Probe -->|"Scan"| n_Cheetah
	n_Probe -->|"Cargo (ammo)"| n_Hoarder
	n_Punisher -->|"Energy turrets"| n_Imperial_Navy_Slicer
	n_Punisher -->|"Energy turrets"| n_Retribution
	n_Punisher -->|"Energy turrets"| n_Vengeance
	n_Punisher -->|"Energy turrets"| n_Coercer
	n_Punisher -->|"Energy turrets"| n_Maller
	n_Rifter -->|"Projectile turrets"| n_Republic_Fleet_Firetail
	n_Rifter -->|"Projectile turrets"| n_Jaguar
	n_Rifter -->|"Projectile turrets"| n_Wolf
	n_Rifter -->|"Projectile turrets"| n_Thrasher
	n_Slasher -->|"Projectile turrets"| n_Republic_Fleet_Firetail
	n_Slasher -->|"Projectile turrets"| n_Claw
	n_Slasher -->|"Projectile turrets"| n_Stiletto
	n_Slasher -->|"Projectile turrets"| n_Thrasher
	n_Slasher -->|"Projectile turrets"| n_Thrasher_Fleet_Issue
	n_Specter -->|"Missiles"| n_Phantom
	n_Tormentor -->|"Energy turrets"| n_Dragoon
	n_Tristan -->|"Drones"| n_Nemesis
	n_Tristan -->|"Drones"| n_Algos
	n_Venture -->|"Mining"| n_Venture_Consortium_Issue
	n_Venture -->|"Mining"| n_Endurance
	n_Venture -->|"Mining"| n_Prospect
	n_Venture -->|"Mining"| n_Covetor
	n_Venture -->|"Mining"| n_Procurer
	n_Venture -->|"Mining"| n_Retriever
	n_Vigil -->|"Target paint"| n_Vigil_Fleet_Issue
	n_Vigil -->|"Target paint"| n_Hyena
	n_Vigil -->|"Target paint"| n_Bellicose
	n_Wraith -->|"Missiles"| n_Phantom
	n_Republic_Fleet_Firetail -->|"Projectile turrets, tackle"| n_Dramiel
	n_Vigil_Fleet_Issue -->|"Web range"| n_Cruor
	n_Vigil_Fleet_Issue -->|"Missiles"| n_Garmur
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
	n_Algos -->|"Drones"| n_Algos_Navy_Issue
	n_Algos -->|"Drones"| n_Magus
	n_Algos -->|"Drones"| n_Vexor
	n_Catalyst -->|"Hybrid turrets"| n_Catalyst_Navy_Issue
	n_Catalyst -->|"Hybrid turrets"| n_Eris
	n_Catalyst -->|"Hybrid turrets"| n_Hecate
	n_Catalyst -->|"Hybrid turrets"| n_Thorax
	n_Coercer -->|"Energy turrets"| n_Coercer_Navy_Issue
	n_Coercer -->|"Energy turrets"| n_Heretic
	n_Coercer -->|"Energy turrets"| n_Confessor
	n_Coercer -->|"Energy turrets"| n_Omen
	n_Corax -->|"Missiles"| n_Corax_Navy_Issue
	n_Corax -->|"Missiles"| n_Mamba
	n_Corax -->|"Missiles"| n_Stork
	n_Corax -->|"Missiles"| n_Jackdaw
	n_Corax -->|"Missiles"| n_Caracal
	n_Cormorant -->|"Hybrid turrets"| n_Cormorant_Navy_Issue
	n_Cormorant -->|"Hybrid turrets"| n_Flycatcher
	n_Cormorant -->|"Hybrid turrets"| n_Moa
	n_Dragoon -->|"Drones"| n_Dragoon_Navy_Issue
	n_Dragoon -->|"Drones"| n_Pontifex
	n_Dragoon -->|"Drones"| n_Arbitrator
	n_Pioneer -->|"Mining"| n_Pioneer_Consortium_Issue
	n_Pioneer -->|"Mining"| n_Outrider
	n_Talwar -->|"Missiles"| n_Talwar_Fleet_Issue
	n_Talwar -->|"Missiles"| n_Bifrost
	n_Talwar -->|"Missiles"| n_Bellicose
	n_Thrasher -->|"Projectile turrets"| n_Thrasher_Fleet_Issue
	n_Thrasher -->|"Projectile turrets"| n_Sabre
	n_Thrasher -->|"Projectile turrets"| n_Svipul
	n_Thrasher -->|"Projectile turrets"| n_Rupture
	n_Thrasher -->|"Projectile turrets"| n_Stabber
	n_Thrasher_Fleet_Issue -->|"Projectile turrets"| n_Mekubal
	n_Thrasher_Fleet_Issue -->|"Projectile turrets"| n_Svipul
	n_Thrasher_Fleet_Issue -->|"Projectile turrets"| n_Stabber
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
	n_Bellicose -->|"Missiles"| n_Orthrus
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
	n_Typhoon -->|"Missiles"| n_Barghest
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
	n_Bestower -->|"Cargo"| n_Impel
	n_Bestower -->|"Cargo"| n_Prorator
	n_Epithal -->|"Cargo"| n_Occator
	n_Iteron_Mark_V -->|"Cargo"| n_Occator
	n_Iteron_Mark_V -->|"Cargo"| n_Viator
	n_Kryos -->|"Cargo"| n_Viator
	n_Mammoth -->|"Cargo"| n_Mastodon
	n_Mammoth -->|"Cargo"| n_Prowler
	n_Miasmos -->|"Cargo"| n_Occator
	n_Nereus -->|"Cargo"| n_Occator
	n_Nereus -->|"Cargo"| n_Viator
	n_Noctis -->|"Salvage"| n_Porpoise
	n_Sigil -->|"Cargo"| n_Prorator
	n_Squall -->|"Cargo"| n_Deluge
	n_Squall -->|"Cargo"| n_Torrent
	n_Tayra -->|"Cargo"| n_Bustard
	n_Wreathe -->|"Cargo"| n_Prowler
	n_Charon -->|"Cargo"| n_Rhea
	n_Fenrir -->|"Cargo"| n_Nomad
	n_Obelisk -->|"Cargo"| n_Anshar
	n_Providence -->|"Cargo"| n_Ark
	n_Orca -->|"Mining foreman bursts"| n_Rorqual
	n_Porpoise -->|"Mining foreman bursts"| n_Orca
	n_Covetor -->|"Mining"| n_Hulk
	n_Procurer -->|"Mining"| n_Skiff
	n_Retriever -->|"Mining"| n_Mackinaw
```
