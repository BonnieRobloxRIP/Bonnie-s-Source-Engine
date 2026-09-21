# = SYSTEM RUN =
# - special extra time due to unfair room design -
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 11 if score endless_timer_ms endless matches 1 if score endless_extended endless matches 0 run scoreboard players set endless_timer_s endless 20
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 20 if score endless_timer_ms endless matches 1 if score endless_extended endless matches 0 run scoreboard players set endless_extended endless 1
# - Open entrance door -
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 20 if score endless_timer_ms endless matches 1 run structure load "hard:HardTunnelDoor2" ~8 ~3 ~-2 90_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 20 if score endless_timer_ms endless matches 10 run structure load "hard:HardTunnelDoor3" ~8 ~3 ~-2 90_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 20 if score endless_timer_ms endless matches 10 run scoreboard players set @e[type=brr:flood_room, name=laser, tag=endless, r=1] laser_spin_speed 20
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 20 if score endless_timer_ms endless matches 10 run scoreboard players set @e[type=brr:flood_room, name=laser, tag=endless, r=1] laser_visibility 1
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 20 if score endless_timer_ms endless matches 10 run playsound sfx.doors.tunnelopen @a[tag=endless] ~8 ~3 ~-1.5
# = Special intro -
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 20 if score endless_timer_ms endless matches 11 run camera @a[tag=endless] set minecraft:free ease 3 out_quad pos ~6 ~4 ~-2 facing ~ ~8 ~
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 18 if score endless_timer_ms endless matches 1 run camera @a[tag=endless] fov_set 45 1 in_quad
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 18 if score endless_timer_ms endless matches 1 run camerashake add @a[tag=endless] 0.4 2 positional
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 18 if score endless_timer_ms endless matches 1 positioned ~ ~8 ~ run scoreboard players set @e[type=brr:flood_room, name=laser, tag=endless, r=1] laser_spin_speed 45
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 18 if score endless_timer_ms endless matches 1 positioned ~ ~8 ~ run scoreboard players set @e[type=brr:flood_room, name=laser, tag=endless, r=1] laser_visibility 1
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 19 if score endless_timer_ms endless matches 1 run effect @a[tag=endless] darkness 2 255 true
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 17 if score endless_timer_ms endless matches 1 run camera @a[tag=endless] fov_set 100 3 out_quad
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 17 if score endless_timer_ms endless matches 1 run structure load "medium/room2:MediumRoom2Offline" ~-7 ~2 ~-14 0_degrees none block_by_block 2
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 16 if score endless_timer_ms endless matches 1 run structure load "hard/room3/2_tesla_power:HMR3V2M1a" ~-2 ~9 ~-2 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 16 if score endless_timer_ms endless matches 6 run structure load "hard/room3/2_tesla_power:HMR3V2M1a" ~-2 ~13 ~-2 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 16 if score endless_timer_ms endless matches 11 run structure load "hard/room3/2_tesla_power:HMR3V2M1a" ~-2 ~17 ~-2 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 16 if score endless_timer_ms endless matches 1 positioned ~ ~9 ~ run scoreboard players set @e[type=brr:flood_room, name=laser, tag=endless, r=1] laser_spin_speed 0
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 16 if score endless_timer_ms endless matches 1 positioned ~ ~9 ~ run scoreboard players set @e[type=brr:flood_room, name=laser, tag=endless, r=1] laser_visibility 0
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 14 if score endless_timer_ms endless matches 1 run camera @a[tag=endless] fov_set 30 1 in_quad
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 13 if score endless_timer_ms endless matches 1 run camera @a[tag=endless] fov_clear 2 out_quad
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 13 if score endless_timer_ms endless matches 1 run camera @a[tag=endless] clear
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 13 if score endless_timer_ms endless matches 1 run structure load "hard/room3/2_tesla_power:HMR3V2M1" ~-2 ~9 ~-2 0_degrees none block_by_block 2
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 13 if score endless_timer_ms endless matches 1 positioned ~ ~9 ~ run scoreboard players set @e[type=brr:flood_room, name=laser, tag=endless, r=1] laser_spin_speed 4
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 13 if score endless_timer_ms endless matches 1 positioned ~ ~9 ~ run scoreboard players set @e[type=brr:flood_room, name=laser, tag=endless, r=1] laser_visibility 1
# - Level title -
execute as @a[tag=endless] at @s if score endless_timer_s endless matches 16 if score endless_timer_ms endless matches 10 if score started endless matches 1 run title @a[tag=endless] subtitle §4Tesla Power
execute as @a[tag=endless] at @s if score endless_timer_s endless matches 20 if score endless_timer_ms endless matches 10 if score started endless matches 1 run titleraw @a[tag=endless] title {"rawtext":[{"text": "§4§lROOM "}, {"score":{"name": "room_count", "objective": "endless"}}]}
execute as @a[tag=endless] at @s run tag @s add endless_music
# - Test for buttons -
# // Button 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if block ^2 ^10 ^5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R3B1a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if score R3B1a endless matches 1 run fill ~ ~9 ~6 ~ ~11 ~6 air destroy
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if score R3B1a endless matches 1 run structure load "hard/room3/2_tesla_power:HMR3V2M2" ~-2 ~9 ~6
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if score R3B1a endless matches 10 run structure load "hard/room3/2_tesla_power:HMR3V2M1" ~-2 ~13 ~-2 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if score R3B1a endless matches 10 positioned ~ ~9 ~ run scoreboard players set @e[type=brr:flood_room, name=laser, tag=endless, r=1] laser_spin_speed 0
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if score R3B1a endless matches 10 positioned ~ ~9 ~ run scoreboard players set @e[type=brr:flood_room, name=laser, tag=endless, r=1] laser_visibility 0
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if score R3B1a endless matches 10 positioned ~ ~13 ~ run scoreboard players set @e[type=brr:flood_room, name=laser, tag=endless, r=1] laser_spin_speed 8
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if score R3B1a endless matches 10 positioned ~ ~13 ~ run scoreboard players set @e[type=brr:flood_room, name=laser, tag=endless, r=1] laser_visibility 1
execute as @s[type=brr:flood_room, name=laser, tag=endless] at @s if score R3B1 endless matches 0 if score R3B1a endless matches 10 run particle brr:electric_pulse ~ ~ ~
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if score R3B1a endless matches 10.. run scoreboard players set R3B1 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 1 if score R3B1a endless matches 10.. run scoreboard players reset R3B1a endless
# // Button 2
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if block ^2 ^14 ^5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R3B2a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if score R3B2a endless matches 1 run fill ~ ~13 ~6 ~ ~15 ~6 air destroy
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if score R3B2a endless matches 1 run structure load "hard/room3/2_tesla_power:HMR3V2M2" ~-2 ~13 ~6
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if score R3B2a endless matches 10 run structure load "hard/room3/2_tesla_power:HMR3V2M1" ~-2 ~17 ~-2 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if score R3B2a endless matches 10 positioned ~ ~13 ~ run scoreboard players set @e[type=brr:flood_room, name=laser, tag=endless, r=1] laser_spin_speed 0
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if score R3B2a endless matches 10 positioned ~ ~13 ~ run scoreboard players set @e[type=brr:flood_room, name=laser, tag=endless, r=1] laser_visibility 0
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if score R3B2a endless matches 10 positioned ~ ~18 ~ run scoreboard players set @e[type=brr:flood_room, name=laser, tag=endless, r=1] laser_spin_speed 12
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if score R3B2a endless matches 10 positioned ~ ~18 ~ run scoreboard players set @e[type=brr:flood_room, name=laser, tag=endless, r=1] laser_visibility 1
execute as @s[type=brr:flood_room, name=laser, tag=endless] at @s if score R3B2 endless matches 0 if score R3B2a endless matches 10 run particle brr:electric_pulse ~ ~ ~
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if score R3B2a endless matches 10.. run scoreboard players set R3B2 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 1 if score R3B2a endless matches 10.. run scoreboard players reset R3B2a endless
# // Button 3
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if block ^2 ^18 ^5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R3B3a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if score R3B3a endless matches 1 run fill ~ ~17 ~6 ~ ~19 ~6 air destroy
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if score R3B3a endless matches 1 run structure load "hard/room3/2_tesla_power:HMR3V2M2" ~-2 ~16 ~6
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if score R3B3a endless matches 10 positioned ~ ~18 ~ run scoreboard players set @e[type=brr:flood_room, name=laser, tag=endless, r=1] laser_spin_speed 15
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if score R3B3a endless matches 10 positioned ~ ~18 ~ run scoreboard players set @e[type=brr:flood_room, name=laser, tag=endless, r=1] laser_visibility 1
execute as @s[type=brr:flood_room, name=laser, tag=endless] at @s if score R3B3 endless matches 0 if score R3B3a endless matches 10 run particle brr:electric_pulse ~ ~ ~
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if score R3B3a endless matches 10.. run scoreboard players set R3B3 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 1 if score R3B3a endless matches 10.. run scoreboard players reset R3B3a endless
# // Exit Button
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B4 endless matches 0 if block ^4 ^22 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="north"] run scoreboard players add R3B4a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B4 endless matches 0 if score R3B4a endless matches 1 run fill ^ ^20 ^7 ^-1 ^20 ^7 air
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B4 endless matches 0 if score R3B4a endless matches 10 run fill ^ ^21 ^7 ^-1 ^21 ^7 air
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B4 endless matches 0 if score R3B4a endless matches 10 run kill @e[type=brr:flood_room, name=laser, tag=endless]
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B4 endless matches 0 if score R3B4a endless matches 10 run tellraw @a[tag=endless] {"rawtext":[{"text": "§4Tunnel Gate has been Opened!"}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B4 endless matches 0 if score R3B4a endless matches 10.. run scoreboard players set R3B4 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B4 endless matches 1 if score R3B4a endless matches 10.. run scoreboard players reset R3B4a endless

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
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 0 run structure load "hard/room3/2_tesla_power:HMR3V2F1" ~-6 ~3 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 2 if score endless_timer_s endless matches 0 run structure load "hard/room3/2_tesla_power:HMR3V2F2" ~-6 ~4 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 3 if score endless_timer_s endless matches 0 run structure load "hard/room3/2_tesla_power:HMR3V2F3" ~-6 ~5 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 4 if score endless_timer_s endless matches 0 run structure load "hard/room3/2_tesla_power:HMR3V2F4" ~-6 ~6 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 5 if score endless_timer_s endless matches 0 run structure load "hard/room3/2_tesla_power:HMR3V2F5" ~-6 ~7 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 6 if score endless_timer_s endless matches 0 run structure load "hard/room3/2_tesla_power:HMR3V2F6" ~-6 ~8 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 7 if score endless_timer_s endless matches 0 run structure load "hard/room3/2_tesla_power:HMR3V2F7" ~-6 ~9 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 8 if score endless_timer_s endless matches 0 run structure load "hard/room3/2_tesla_power:HMR3V2F8" ~-6 ~10 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 9 if score endless_timer_s endless matches 0 run structure load "hard/room3/2_tesla_power:HMR3V2F9" ~-6 ~11 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 10 if score endless_timer_s endless matches 0 run structure load "hard/room3/2_tesla_power:HMR3V2F10" ~-6 ~12 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 11 if score endless_timer_s endless matches 0 run structure load "hard/room3/2_tesla_power:HMR3V2F11" ~-6 ~13 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 12 if score endless_timer_s endless matches 0 run structure load "hard/room3/2_tesla_power:HMR3V2F12" ~-6 ~14 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 13 if score endless_timer_s endless matches 0 run structure load "hard/room3/2_tesla_power:HMR3V2F13" ~-6 ~15 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 14 if score endless_timer_s endless matches 0 run structure load "hard/room3/2_tesla_power:HMR3V2F14" ~-6 ~16 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 15 if score endless_timer_s endless matches 0 run structure load "hard/room3/2_tesla_power:HMR3V2F15" ~-6 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 16 if score endless_timer_s endless matches 0 run structure load "hard/room3/2_tesla_power:HMR3V2F16" ~-6 ~18 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 17 if score endless_timer_s endless matches 0 run structure load "hard/room3/2_tesla_power:HMR3V2F17" ~-6 ~19 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 18 if score endless_timer_s endless matches 0 run structure load "hard/room3/2_tesla_power:HMR3V2F18" ~-6 ~20 ~-6 0_degrees none block_by_block 1
# // flood end
execute if score endless_timer_s endless matches ..0 run scoreboard players set endless_timer_s endless 4
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
execute if score endless_transition endless matches 10.. run kill @e[type=brr:flood_room, name=laser, tag=endless]
# // Room 3 Glitch Animation
execute as @s[type=brr:flood_room, name=endless] at @s unless score endless_end endless matches 1 if score started endless matches 1 run scoreboard players add endless_animation endless 1
execute as @s[type=brr:flood_room, name=endless] at @s unless score endless_end endless matches 1 if score endless_animation endless matches 1 run structure load "hard/room3:HardRoom3a" ~-8 ~1 ~-7
execute as @s[type=brr:flood_room, name=endless] at @s unless score endless_end endless matches 1 if score endless_animation endless matches 3 run structure load "hard/room3:HardRoom3b" ~-8 ~1 ~-7
execute as @s[type=brr:flood_room, name=endless] at @s unless score endless_end endless matches 1 if score endless_animation endless matches 5 run structure load "hard/room3:HardRoom3c" ~-8 ~1 ~-7
execute as @s[type=brr:flood_room, name=endless] at @s unless score endless_end endless matches 1 if score endless_animation endless matches 6.. run scoreboard players reset endless_animation endless

