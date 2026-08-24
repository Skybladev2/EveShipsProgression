# EveShipsProgression

```mermaid
flowchart
	
	
	
	subgraph s1["Frigate"]
		n5["Slasher"]
		n1["Rifter"]
	end
	n1
	subgraph s2["Cruiser"]
		n7["Rupture"]
		n2["Stabber"]
	end
	n1 -->|"Projectile Turret rate of fire, Projectile Turret falloff"| n2
	subgraph s3["Battlecruiser"]
		n3["Tornado"]
	end
	n2 -->|"Projectile Turret rate of fire, Projectile Turret falloff"| n3
	subgraph s4["Battleship"]
		n4["Tempest"]
	end
	n3 -->|"Projectile Turret rate of fire"| n4
	subgraph s5["Destroyer"]
		n6["Thrasher"]
	end
	n5 -->|"Projectile Turret damage, Projectile Turret tracking speed"| n6
	n6 -->|"Projectile Turret damage, Projectile Turret tracking speed"| n7
```
