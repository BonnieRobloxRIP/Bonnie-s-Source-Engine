# = SYSTEM RUN =
# - special extra time due to unfair room design -
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 11 if score endless_timer_ms endless matches 1 if score endless_extended endless matches 0 run scoreboard players set endless_timer_s endless 20
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 20 if score endless_timer_ms endless matches 1 if score endless_extended endless matches 0 run scoreboard players set endless_extended endless 1
# - Open entrance door -
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 20 if score endless_timer_ms endless matches 1 run structure load "hard:HardTunnelDoor2" ~8 ~3 ~-2 90_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 20 if score endless_timer_ms endless matches 10 run structure load "hard:HardTunnelDoor3" ~8 ~3 ~-2 90_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 20 if score endless_timer_ms endless matches 10 run playsound sfx.doors.tunnelopen @a[tag=endless] ~8 ~3 ~-1.5
# - Level title -
execute as @a[tag=endless] at @s if score endless_timer_s endless matches 20 if score endless_timer_ms endless matches 10 if score started endless matches 1 run title @a[tag=endless] subtitle §4Master Lift
execute as @a[tag=endless] at @s if score endless_timer_s endless matches 20 if score endless_timer_ms endless matches 10 if score started endless matches 1 run titleraw @a[tag=endless] title {"rawtext":[{"text": "§4§lROOM "}, {"score":{"name": "room_count", "objective": "endless"}}]}
execute as @a[tag=endless] at @s run tag @s add endless_music
# - Test for buttons -
# // Button 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if block ^-6 ^4 ^5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players add R3B1a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if score R3B1a endless matches 1 run fill ~-5 ~3 ~4 ~-5 ~5 ~4 air destroy
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if score R3B1a endless matches 1 run tellraw @a[tag=endless] {"rawtext":[{"text": "§4§lALERT: §r§4Lift will rise in §l3§r§4."}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if score R3B1a endless matches 21 run tellraw @a[tag=endless] {"rawtext":[{"text": "§4§lALERT: §r§4Lift will rise in §l2§r§4.."}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if score R3B1a endless matches 41 run tellraw @a[tag=endless] {"rawtext":[{"text": "§4§lALERT: §r§4Lift will rise in §l1§r§4..."}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if score R3B1a endless matches 41 run playsound sfx.elevator.platform.start @a[tag=endless]
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if score R3B1a endless matches 81 run stopsound @a[tag=endless] sfx.elevator.platform.start
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if score R3B1a endless matches 81 run playsound sfx.elevator.platform.stop @a[tag=endless]
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if score R3B1a endless matches 61 run structure load "hard/room3/1_master_lift:HMR3V1M1" ~-2 ~3 ~-2
execute as @s[type=brr:flood_room, name=endless] at @s positioned ~-2 ~4 ~-2 as @a[tag=endless, dx=4, dy=2, dz=4] at @s[tag=endless] if score R3B1 endless matches 0 if score R3B1a endless matches 61 run tp @s ~ ~1 ~
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if score R3B1a endless matches 71 run structure load "hard/room3/1_master_lift:HMR3V1M1" ~-2 ~4 ~-2
execute as @s[type=brr:flood_room, name=endless] at @s positioned ~-2 ~5 ~-2 as @a[tag=endless, dx=4, dy=2, dz=4] at @s[tag=endless] if score R3B1 endless matches 0 if score R3B1a endless matches 71 run tp @s ~ ~1 ~
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if score R3B1a endless matches 81 run structure load "hard/room3/1_master_lift:HMR3V1M1" ~-2 ~5 ~-2
execute as @s[type=brr:flood_room, name=endless] at @s positioned ~-2 ~6 ~-2 as @a[tag=endless, dx=4, dy=2, dz=4] at @s[tag=endless] if score R3B1 endless matches 0 if score R3B1a endless matches 81 run tp @s ~ ~1 ~
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if score R3B1a endless matches 81.. run scoreboard players set R3B1 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 1 if score R3B1a endless matches 81.. run scoreboard players reset R3B1a endless
# // Button 2
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if block ^-6 ^9 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players add R3B2a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if score R3B2a endless matches 1 run fill ~-5 ~7 ~4 ~-5 ~9 ~4 air destroy
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if score R3B2a endless matches 1 run tellraw @a[tag=endless] {"rawtext":[{"text": "§4§lALERT: §r§4Lift will rise in §l3§r§4."}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if score R3B2a endless matches 21 run tellraw @a[tag=endless] {"rawtext":[{"text": "§4§lALERT: §r§4Lift will rise in §l2§r§4.."}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if score R3B2a endless matches 41 run tellraw @a[tag=endless] {"rawtext":[{"text": "§4§lALERT: §r§4Lift will rise in §l1§r§4..."}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if score R3B2a endless matches 41 run playsound sfx.elevator.platform.start @a[tag=endless]
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if score R3B2a endless matches 91 run stopsound @a[tag=endless] sfx.elevator.platform.start
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if score R3B2a endless matches 91 run playsound sfx.elevator.platform.stop @a[tag=endless]
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if score R3B2a endless matches 61 run structure load "hard/room3/1_master_lift:HMR3V1M1" ~-2 ~6 ~-2
execute as @s[type=brr:flood_room, name=endless] at @s positioned ~-2 ~7 ~-2 as @a[tag=endless, dx=4, dy=2, dz=4] at @s[tag=endless] if score R3B2 endless matches 0 if score R3B2a endless matches 61 run tp @s ~ ~1 ~
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if score R3B2a endless matches 71 run structure load "hard/room3/1_master_lift:HMR3V1M1" ~-2 ~7 ~-2
execute as @s[type=brr:flood_room, name=endless] at @s positioned ~-2 ~8 ~-2 as @a[tag=endless, dx=4, dy=2, dz=4] at @s[tag=endless] if score R3B2 endless matches 0 if score R3B2a endless matches 71 run tp @s ~ ~1 ~
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if score R3B2a endless matches 81 run structure load "hard/room3/1_master_lift:HMR3V1M1" ~-2 ~8 ~-2
execute as @s[type=brr:flood_room, name=endless] at @s positioned ~-2 ~9 ~-2 as @a[tag=endless, dx=4, dy=2, dz=4] at @s[tag=endless] if score R3B2 endless matches 0 if score R3B2a endless matches 81 run tp @s ~ ~1 ~
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if score R3B2a endless matches 91 run structure load "hard/room3/1_master_lift:HMR3V1M1" ~-2 ~9 ~-2
execute as @s[type=brr:flood_room, name=endless] at @s positioned ~-2 ~10 ~-2 as @a[tag=endless, dx=4, dy=2, dz=4] at @s[tag=endless] if score R3B2 endless matches 0 if score R3B2a endless matches 91 run tp @s ~ ~1 ~
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if score R3B2a endless matches 91.. run scoreboard players set R3B2 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 1 if score R3B2a endless matches 91.. run scoreboard players reset R3B2a endless
# // Button 3
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if block ^-6 ^13 ^5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players add R3B3a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if score R3B3a endless matches 1 run fill ~-5 ~11 ~4 ~-5 ~13 ~4 air destroy
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if score R3B3a endless matches 1 run tellraw @a[tag=endless] {"rawtext":[{"text": "§4§lALERT: §r§4Lift will rise in §l3§r§4."}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if score R3B3a endless matches 21 run tellraw @a[tag=endless] {"rawtext":[{"text": "§4§lALERT: §r§4Lift will rise in §l2§r§4.."}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if score R3B3a endless matches 41 run tellraw @a[tag=endless] {"rawtext":[{"text": "§4§lALERT: §r§4Lift will rise in §l1§r§4..."}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if score R3B3a endless matches 41 run playsound sfx.elevator.platform.start @a[tag=endless]
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if score R3B3a endless matches 91 run stopsound @a[tag=endless] sfx.elevator.platform.start
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if score R3B3a endless matches 91 run playsound sfx.elevator.platform.stop @a[tag=endless]
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if score R3B3a endless matches 61 run structure load "hard/room3/1_master_lift:HMR3V1M1" ~-2 ~10 ~-2
execute as @s[type=brr:flood_room, name=endless] at @s positioned ~-2 ~11 ~-2 as @a[tag=endless, dx=4, dy=2, dz=4] at @s[tag=endless] if score R3B3 endless matches 0 if score R3B3a endless matches 61 run tp @s ~ ~1 ~
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if score R3B3a endless matches 71 run structure load "hard/room3/1_master_lift:HMR3V1M1" ~-2 ~11 ~-2
execute as @s[type=brr:flood_room, name=endless] at @s positioned ~-2 ~12 ~-2 as @a[tag=endless, dx=4, dy=2, dz=4] at @s[tag=endless] if score R3B3 endless matches 0 if score R3B3a endless matches 71 run tp @s ~ ~1 ~
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if score R3B3a endless matches 81 run structure load "hard/room3/1_master_lift:HMR3V1M1" ~-2 ~12 ~-2
execute as @s[type=brr:flood_room, name=endless] at @s positioned ~-2 ~13 ~-2 as @a[tag=endless, dx=4, dy=2, dz=4] at @s[tag=endless] if score R3B3 endless matches 0 if score R3B3a endless matches 81 run tp @s ~ ~1 ~
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if score R3B3a endless matches 91 run structure load "hard/room3/1_master_lift:HMR3V1M1" ~-2 ~13 ~-2
execute as @s[type=brr:flood_room, name=endless] at @s positioned ~-2 ~14 ~-2 as @a[tag=endless, dx=4, dy=2, dz=4] at @s[tag=endless] if score R3B3 endless matches 0 if score R3B3a endless matches 91 run tp @s ~ ~1 ~
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if score R3B3a endless matches 91.. run scoreboard players set R3B3 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 1 if score R3B3a endless matches 91.. run scoreboard players reset R3B3a endless
# // Button 4
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B4 endless matches 0 if block ^-5 ^17 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run scoreboard players add R3B4a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B4 endless matches 0 if score R3B4a endless matches 1 run fill ~-5 ~15 ~4 ~-5 ~17 ~4 air destroy
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B4 endless matches 0 if score R3B4a endless matches 1 run tellraw @a[tag=endless] {"rawtext":[{"text": "§4§lALERT: §r§4Lift will rise in §l3§r§4."}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B4 endless matches 0 if score R3B4a endless matches 21 run tellraw @a[tag=endless] {"rawtext":[{"text": "§4§lALERT: §r§4Lift will rise in §l2§r§4.."}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B4 endless matches 0 if score R3B4a endless matches 41 run tellraw @a[tag=endless] {"rawtext":[{"text": "§4§lALERT: §r§4Lift will rise in §l1§r§4..."}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B4 endless matches 0 if score R3B4a endless matches 41 run playsound sfx.elevator.platform.start @a[tag=endless]
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B4 endless matches 0 if score R3B4a endless matches 101 run stopsound @a[tag=endless] sfx.elevator.platform.start
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B4 endless matches 0 if score R3B4a endless matches 101 run playsound sfx.elevator.platform.stop @a[tag=endless]
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B4 endless matches 0 if score R3B4a endless matches 61 run structure load "hard/room3/1_master_lift:HMR3V1M1" ~-2 ~14 ~-2
execute as @s[type=brr:flood_room, name=endless] at @s positioned ~-2 ~15 ~-2 as @a[tag=endless, dx=4, dy=2, dz=4] at @s[tag=endless] if score R3B4 endless matches 0 if score R3B4a endless matches 61 run tp @s ~ ~1 ~
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B4 endless matches 0 if score R3B4a endless matches 71 run structure load "hard/room3/1_master_lift:HMR3V1M1" ~-2 ~15 ~-2
execute as @s[type=brr:flood_room, name=endless] at @s positioned ~-2 ~16 ~-2 as @a[tag=endless, dx=4, dy=2, dz=4] at @s[tag=endless] if score R3B4 endless matches 0 if score R3B4a endless matches 71 run tp @s ~ ~1 ~
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B4 endless matches 0 if score R3B4a endless matches 81 run structure load "hard/room3/1_master_lift:HMR3V1M1" ~-2 ~16 ~-2
execute as @s[type=brr:flood_room, name=endless] at @s positioned ~-2 ~17 ~-2 as @a[tag=endless, dx=4, dy=2, dz=4] at @s[tag=endless] if score R3B4 endless matches 0 if score R3B4a endless matches 81 run tp @s ~ ~1 ~
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B4 endless matches 0 if score R3B4a endless matches 91 run structure load "hard/room3/1_master_lift:HMR3V1M1" ~-2 ~17 ~-2
execute as @s[type=brr:flood_room, name=endless] at @s positioned ~-2 ~18 ~-2 as @a[tag=endless, dx=4, dy=2, dz=4] at @s[tag=endless] if score R3B4 endless matches 0 if score R3B4a endless matches 91 run tp @s ~ ~1 ~
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B4 endless matches 0 if score R3B4a endless matches 101 run structure load "hard/room3/1_master_lift:HMR3V1M1" ~-2 ~18 ~-2
execute as @s[type=brr:flood_room, name=endless] at @s positioned ~-2 ~19 ~-2 as @a[tag=endless, dx=4, dy=2, dz=4] at @s[tag=endless] if score R3B4 endless matches 0 if score R3B4a endless matches 101 run tp @s ~ ~1 ~
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B4 endless matches 0 if score R3B4a endless matches 101.. run scoreboard players set R3B4 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B4 endless matches 1 if score R3B4a endless matches 101.. run scoreboard players reset R3B4a endless
# // Exit Button
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B5 endless matches 0 if block ^6 ^22 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="north"] run scoreboard players add R3B5a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B5 endless matches 0 if score R3B5a endless matches 1 run fill ^4 ^21 ^5 ^4 ^22 ^5 air destroy
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B5 endless matches 0 if score R3B5a endless matches 1 run fill ^ ^20 ^7 ^-1 ^20 ^7 air
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B5 endless matches 0 if score R3B5a endless matches 10 run fill ^ ^21 ^7 ^-1 ^21 ^7 air
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B5 endless matches 0 if score R3B5a endless matches 10 run tellraw @a[tag=endless] {"rawtext":[{"text": "§4Tunnel Gate has been Opened!"}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B5 endless matches 0 if score R3B5a endless matches 10.. run scoreboard players set R3B5 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B5 endless matches 1 if score R3B5a endless matches 10.. run scoreboard players reset R3B5a endless
# // - Flooding -
execute if score started endless matches 1 if score p_game endless matches 1.. if score endless_end endless matches 0 run scoreboard players add endless_timer_ms endless 1
execute if score endless_timer_ms endless matches 20.. run scoreboard players remove endless_timer_s endless 1
execute if score endless_timer_ms endless matches 20.. run scoreboard players set endless_timer_ms endless 0
execute if score endless_timer_s endless matches ..0 run scoreboard players add flood endless 1
# // flood part
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 4 if score endless_timer_ms endless matches 0 run playsound sfx.doors.opened @a[tag=endless] ~8 ~3 ~1.5 1 0.7
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 4 if score endless_timer_ms endless matches 0 run structure load "hard:HardTunnelDoor2" ~8 ~3 ~-2 90_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 4 if score endless_timer_ms endless matches 5 run structure load "hard:HardTunnelDoor1" ~8 ~3 ~-2 90_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 4 if score endless_timer_ms endless matches 5 run structure load "easy:NuhUh" ~8 ~2 ~-3  90_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 4 if score endless_timer_ms endless matches 1 run tellraw @a[tag=endless] {"rawtext":[{"text":"§3Wa§kter is §r§3r§kis§r§3ing§k!"}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 4 if score endless_timer_ms endless matches 10 run tellraw @a[tag=endless] {"rawtext":[{"text":"§5Wat§ker §r§5is r§kis§r§5i§kng!"}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 4 if score endless_timer_ms endless matches 14 run tellraw @a[tag=endless] {"rawtext":[{"text":"§6§kWate§r§5r is §r§6r§kising§k!"}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 4 if score endless_timer_ms endless matches 15 run tellraw @a[tag=endless] {"rawtext":[{"text":"§4§kWater is rising!"}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 4 if score endless_timer_ms endless matches 17 run tellraw @a[tag=endless] {"rawtext":[{"text":"§4§k!!§r§4Die§k!!"}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 0 run structure load "hard/room3/1_master_lift:HMR3V1F1" ~-6 ~3 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 2 if score endless_timer_s endless matches 0 run structure load "hard/room3/1_master_lift:HMR3V1F2" ~-6 ~4 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 3 if score endless_timer_s endless matches 0 run structure load "hard/room3/1_master_lift:HMR3V1F3" ~-6 ~5 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 4 if score endless_timer_s endless matches 0 run structure load "hard/room3/1_master_lift:HMR3V1F4" ~-6 ~6 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 5 if score endless_timer_s endless matches 0 run structure load "hard/room3/1_master_lift:HMR3V1F5" ~-6 ~7 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 6 if score endless_timer_s endless matches 0 run structure load "hard/room3/1_master_lift:HMR3V1F6" ~-6 ~8 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 7 if score endless_timer_s endless matches 0 run structure load "hard/room3/1_master_lift:HMR3V1F7" ~-6 ~9 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 8 if score endless_timer_s endless matches 0 run structure load "hard/room3/1_master_lift:HMR3V1F8" ~-6 ~10 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 9 if score endless_timer_s endless matches 0 run structure load "hard/room3/1_master_lift:HMR3V1F9" ~-6 ~11 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 10 if score endless_timer_s endless matches 0 run structure load "hard/room3/1_master_lift:HMR3V1F10" ~-6 ~12 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 11 if score endless_timer_s endless matches 0 run structure load "hard/room3/1_master_lift:HMR3V1F11" ~-6 ~13 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 12 if score endless_timer_s endless matches 0 run structure load "hard/room3/1_master_lift:HMR3V1F12" ~-6 ~14 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 13 if score endless_timer_s endless matches 0 run structure load "hard/room3/1_master_lift:HMR3V1F13" ~-6 ~15 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 14 if score endless_timer_s endless matches 0 run structure load "hard/room3/1_master_lift:HMR3V1F14" ~-6 ~16 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 15 if score endless_timer_s endless matches 0 run structure load "hard/room3/1_master_lift:HMR3V1F15" ~-6 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 16 if score endless_timer_s endless matches 0 run structure load "hard/room3/1_master_lift:HMR3V1F16" ~-6 ~18 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 17 if score endless_timer_s endless matches 0 run structure load "hard/room3/1_master_lift:HMR3V1F17" ~-6 ~19 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 18 if score endless_timer_s endless matches 0 run structure load "hard/room3/1_master_lift:HMR3V1F18" ~-6 ~20 ~-6 0_degrees none block_by_block 1
# // flood end
execute if score endless_timer_s endless matches ..0 run scoreboard players set endless_timer_s endless 5
execute if score flood endless matches 18 if score endless_timer_ms endless matches 10 run scoreboard players set endless_end endless 1
# // exit tunnel
execute as @s[type=brr:flood_room, name=endless] at @s run tag @a[tag=endless, x=~-1, y=~20, z=~8, dx=1, dy=1, dz=5] add endlesstunnel
execute as @s[type=brr:flood_room, name=endless] at @s run tag @a[tag=endless, x=~-1, y=~20, z=~7, dx=1, dy=1, dz=0] remove endlesstunnel
# // exit player count
scoreboard players set p_tunnel endless 0
execute as @a[tag=endlesstunnel] at @s run scoreboard players add p_tunnel endless 1
# // transition into room 3
execute if score p_tunnel endless = p_game endless run scoreboard players set endless_end endless 1
execute if score endless_end endless matches 1 run scoreboard players add endless_transition endless 1
execute if score endless_transition endless matches 1 as @s[type=brr:flood_room, name=endless] at @s run playsound sfx.doors.opened @a[tag=endless] ~-0.5 ~21.5 ~8 1 0.7
execute if score endless_transition endless matches 1 as @s[type=brr:flood_room, name=endless] at @s run structure load "hard:HardTunnelDoor2" ~-1 ~20 ~8
execute if score endless_transition endless matches 10 as @s[type=brr:flood_room, name=endless] at @s run structure load "hard:HardTunnelDoor1" ~-1 ~20 ~8
execute if score endless_transition endless matches 10 as @s[type=brr:flood_room, name=endless] at @s positioned ~ ~2 ~ run fill ~-6 ~1 ~-6 ~6 ~20 ~6 water
execute if score endless_transition endless matches 31.. run function game_functions/mode_endless/reset_room
# // Room 3 Glitch Animation
execute as @s[type=brr:flood_room, name=endless] at @s unless score endless_end endless matches 1 if score started endless matches 1 run scoreboard players add endless_animation endless 1
execute as @s[type=brr:flood_room, name=endless] at @s unless score endless_end endless matches 1 if score endless_animation endless matches 1 run structure load "hard/room3:HardRoom3a" ~-8 ~1 ~-7
execute as @s[type=brr:flood_room, name=endless] at @s unless score endless_end endless matches 1 if score endless_animation endless matches 3 run structure load "hard/room3:HardRoom3b" ~-8 ~1 ~-7
execute as @s[type=brr:flood_room, name=endless] at @s unless score endless_end endless matches 1 if score endless_animation endless matches 5 run structure load "hard/room3:HardRoom3c" ~-8 ~1 ~-7
execute as @s[type=brr:flood_room, name=endless] at @s unless score endless_end endless matches 1 if score endless_animation endless matches 6.. run scoreboard players reset endless_animation endless

