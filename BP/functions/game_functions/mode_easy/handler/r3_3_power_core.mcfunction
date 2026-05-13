# = SYSTEM RUN =
# - Open entrance door -
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score started3 easy matches 1 if score r3_timer_s easy matches 21 if score r3_timer_ms easy matches 1 run structure load mystructure:EasyTunnelDoor2 ~-2 ~3 ~-8
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score started3 easy matches 1 if score r3_timer_s easy matches 21 if score r3_timer_ms easy matches 10 run structure load mystructure:EasyTunnelDoor3 ~-2 ~3 ~-8
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score started3 easy matches 1 if score r3_timer_s easy matches 21 if score r3_timer_ms easy matches 10 run playsound sfx.doors.tunnelopen @a[tag=easy] ~-3.5 ~4 ~-8
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score started3 easy matches 1 if score r3_timer_s easy matches 21 if score r3_timer_ms easy matches 10 run tellraw @a[tag=easy] {"rawtext":[{"text": "§aAdditional Objective: §2Stabilize the core before the water reaches it!"}]}
# - Level title -
execute as @a[tag=easy] at @s if score r3_timer_s easy matches 21 if score r3_timer_ms easy matches 10 if score started3 easy matches 1 run title @a[tag=easy] subtitle §2Power Core
execute as @a[tag=easy] at @s if score r3_timer_s easy matches 21 if score r3_timer_ms easy matches 10 if score started3 easy matches 1 run title @a[tag=easy] title §aROOM 3
# - Test for buttons -
# // Button 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if block ^5 ^8 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R3B1a easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if score R3B1a easy matches 50 if block ^5 ^8 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set core1 easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if score R3B1a easy matches 50 if block ^5 ^8 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players reset core easy
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if score R3B1a easy matches 1 if block ^5 ^8 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load mystructure:EMR3V3M1 ^6 ^8 ^-2 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if score R3B1a easy matches 1 if block ^5 ^8 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load mystructure:CoreBlaster1 ^ ^19 ^-6 180_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if score R3B1a easy matches 25 if block ^5 ^8 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load mystructure:CoreBlaster2 ^ ^19 ^-6 180_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if score R3B1a easy matches 50 if block ^5 ^8 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load mystructure:CoreBlaster3 ^ ^19 ^-6 180_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if score R3B1a easy matches 50 if block ^5 ^8 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set core_laser1 easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if score R3B1a easy matches 99.. if block ^5 ^8 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set R3B1 easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B1a easy matches 99.. if block ^5 ^8 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set core1 easy 0
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B1a easy matches 99.. if block ^5 ^8 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players reset R3B1a easy
# // Button 2
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B2 easy matches 0 if block ^5 ^13 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players add R3B2a easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B2 easy matches 0 if score R3B2a easy matches 50 if block ^5 ^13 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players set core1 easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B2 easy matches 0 if score R3B2a easy matches 50 if block ^5 ^13 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players reset core easy
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B2 easy matches 0 if score R3B2a easy matches 1 if block ^5 ^13 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run structure load mystructure:CoreBlaster1 ^3 ^19 ^ 270_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B2 easy matches 0 if score R3B2a easy matches 25 if block ^5 ^13 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run structure load mystructure:CoreBlaster2 ^3 ^19 ^ 270_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B2 easy matches 0 if score R3B2a easy matches 50 if block ^5 ^13 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run structure load mystructure:CoreBlaster3 ^3 ^19 ^ 270_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B2 easy matches 0 if score R3B2a easy matches 50 if block ^5 ^13 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players set core_laser2 easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B2 easy matches 0 if score R3B2a easy matches 99.. if block ^5 ^13 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players set R3B2 easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B2 easy matches 1 if score R3B2a easy matches 99.. if block ^5 ^13 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players set core1 easy 0
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B2 easy matches 1 if score R3B2a easy matches 99.. if block ^5 ^13 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players reset R3B2a easy
# // Button 3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B3 easy matches 0 if block ^-5 ^19 ^5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R3B3a easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B3 easy matches 0 if score R3B3a easy matches 50 if block ^-5 ^19 ^5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set core1 easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B3 easy matches 0 if score R3B3a easy matches 50 if block ^-5 ^19 ^5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players reset core easy
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B3 easy matches 0 if score R3B3a easy matches 1 if block ^-5 ^19 ^5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load mystructure:EMR3V3M2 ^2 ^15 ^-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B3 easy matches 0 if score R3B3a easy matches 1 if block ^-5 ^19 ^5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load mystructure:CoreBlaster1 ^ ^19 ^3 
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B3 easy matches 0 if score R3B3a easy matches 25 if block ^-5 ^19 ^5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load mystructure:CoreBlaster2 ^ ^19 ^3 
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B3 easy matches 0 if score R3B3a easy matches 50 if block ^-5 ^19 ^5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load mystructure:CoreBlaster3 ^ ^19 ^3 
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B3 easy matches 0 if score R3B3a easy matches 50 if block ^-5 ^19 ^5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set core_laser3 easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B3 easy matches 0 if score R3B3a easy matches 99.. if block ^-5 ^19 ^5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set R3B3 easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B3 easy matches 1 if score R3B3a easy matches 99.. if block ^-5 ^19 ^5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set core1 easy 0
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B3 easy matches 1 if score R3B3a easy matches 99.. if block ^-5 ^19 ^5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players reset R3B3a easy
# // Exit Button
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B4 easy matches 0 if block ^-6 ^20 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players add R3B4a easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B4 easy matches 0 if score R3B4a easy matches 40 if block ^-6 ^20 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players set core1 easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B4 easy matches 0 if score R3B4a easy matches 40 if block ^-6 ^20 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players reset core easy
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B4 easy matches 0 if score R3B4a easy matches 40 if block ^-6 ^20 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run fill ^7 ^20 ^3 ^4 ^20 ^4 air
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B4 easy matches 0 if score R3B4a easy matches 50 if block ^-6 ^20 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run fill ^7 ^21 ^3 ^4 ^21 ^4 air
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B4 easy matches 0 if score R3B4a easy matches 50 if block ^-6 ^20 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run tellraw @a[tag=easy] {"rawtext":[{"text": "§aTunnel Gate has been Opened!"}]}
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B4 easy matches 0 if score R3B4a easy matches 50 if block ^-6 ^20 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run structure load mystructure:EMR3V3M2 ^6 ^17 ^3 90_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B4 easy matches 0 if score R3B4a easy matches 1 if block ^-6 ^20 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run structure load mystructure:CoreBlaster1 ^-6 ^19 ^ 90_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B4 easy matches 0 if score R3B4a easy matches 25 if block ^-6 ^20 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run structure load mystructure:CoreBlaster2 ^-6 ^19 ^ 90_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B4 easy matches 0 if score R3B4a easy matches 50 if block ^-6 ^20 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run structure load mystructure:CoreBlaster3 ^-6 ^19 ^ 90_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B4 easy matches 0 if score R3B4a easy matches 50 if block ^-6 ^20 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players set core_laser4 easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B4 easy matches 0 if score R3B4a easy matches 120.. if block ^-6 ^20 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players set R3B4 easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B4 easy matches 1 if score R3B4a easy matches 120.. if block ^-6 ^20 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players reset R3B4a easy
# // - Flooding -
execute if score started3 easy matches 1 if score p_game easy matches 1.. if score r3_end easy matches 0 run scoreboard players add r3_timer_ms easy 1
execute if score r3_timer_ms easy matches 20.. run scoreboard players remove r3_timer_s easy 1
execute if score r3_timer_ms easy matches 20.. run scoreboard players set r3_timer_ms easy 0
execute if score r3_timer_s easy matches ..0 run scoreboard players add flood3 easy 1
# // flood part
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 1 if score r3_timer_s easy matches 3 if score r3_timer_ms easy matches 0 run playsound sfx.doors.opened @a[tag=easy] ~-3.5 ~4 ~-8 1 0.7
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 1 if score r3_timer_s easy matches 3 if score r3_timer_ms easy matches 0 run structure load mystructure:EasyTunnelDoor2 ~-2 ~3 ~-8
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 1 if score r3_timer_s easy matches 3 if score r3_timer_ms easy matches 5 run structure load mystructure:EasyTunnelDoor1 ~-2 ~3 ~-8
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 1 if score r3_timer_s easy matches 3 if score r3_timer_ms easy matches 5 run structure load mystructure:NuhUh ~-2 ~3 ~-13
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 1 if score r3_timer_s easy matches 0 run tellraw @a[tag=easy] {"rawtext":[{"text":"§3Water is rising!"}]}
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 1 if score r3_timer_s easy matches 0 run structure load mystructure:EMR3V3F1 ~-6 ~2 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 2 if score r3_timer_s easy matches 0 run structure load mystructure:EMR3V3F2 ~-6 ~3 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 3 if score r3_timer_s easy matches 0 run structure load mystructure:EMR3V3F3 ~-6 ~4 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 4 if score r3_timer_s easy matches 0 run structure load mystructure:EMR3V3F4 ~-6 ~5 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 5 if score r3_timer_s easy matches 0 run structure load mystructure:EMR3V3F5 ~-6 ~6 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 6 if score r3_timer_s easy matches 0 run structure load mystructure:EMR3V3F6 ~-6 ~7 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 7 if score r3_timer_s easy matches 0 run structure load mystructure:EMR3V3F7 ~-6 ~8 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 8 if score r3_timer_s easy matches 0 run structure load mystructure:EMR3V3F8 ~-6 ~9 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 9 if score r3_timer_s easy matches 0 run structure load mystructure:EMR3V3F9 ~-6 ~10 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 10 if score r3_timer_s easy matches 0 run structure load mystructure:EMR3V3F10 ~-6 ~11 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 11 if score r3_timer_s easy matches 0 run structure load mystructure:EMR3V3F11 ~-6 ~12 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 12 if score r3_timer_s easy matches 0 run structure load mystructure:EMR3V3F12 ~-6 ~13 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 12 if score r3_timer_s easy matches 0 if score R3B4 easy matches 0 run scoreboard players set core1 easy 2
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 12 if score r3_timer_s easy matches 0 if score R3B4 easy matches 0 run scoreboard players reset core easy
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 13 if score r3_timer_s easy matches 0 run structure load mystructure:EMR3V3F13 ~-6 ~14 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 14 if score r3_timer_s easy matches 0 run structure load mystructure:EMR3V3F14 ~-6 ~15 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 15 if score r3_timer_s easy matches 0 run structure load mystructure:EMR3V3F15 ~-6 ~16 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 16 if score r3_timer_s easy matches 0 run structure load mystructure:EMR3V3F16 ~-6 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 17 if score r3_timer_s easy matches 0 run structure load mystructure:EMR3V3F17 ~-6 ~18 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 18 if score r3_timer_s easy matches 0 run structure load mystructure:EMR3V3F18 ~-6 ~19 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 19 if score r3_timer_s easy matches 0 run structure load mystructure:EMR3V3F19 ~-6 ~20 ~-6 0_degrees none block_by_block 1
# // flood end
execute if score r3_timer_s easy matches ..0 run scoreboard players set r3_timer_s easy 4
execute if score flood3 easy matches 18 if score r3_timer_ms easy matches 10 run scoreboard players set r3_end easy 1
# // exit tunnel
execute as @s[type=brr:flood_room, name=easy_room3] at @s run tag @a[tag=easy, x=~8, y=~20, z=~2, dx=6, dy=1, dz=1] add easytunnel3
execute as @s[type=brr:flood_room, name=easy_room3] at @s run tag @a[tag=easy, x=~7, y=~20, z=~2, dx=0, dy=1, dz=1] remove easytunnel3
# // exit player count
scoreboard players set p_tunnel3 easy 0
execute as @a[tag=easytunnel3] at @s run scoreboard players add p_tunnel3 easy 1
# // transition into room 3
execute if score p_tunnel3 easy = p_game easy if score started4 easy matches 0 run scoreboard players set r3_end easy 1
execute if score r3_end easy matches 1 run scoreboard players add r3_transition easy 1
execute if score r3_transition easy matches 1 as @s[type=brr:flood_room, name=easy_room3] at @s run playsound sfx.doors.opened @a[tag=easy] ~8 ~20.5 ~3.5 1 0.7
execute if score r3_transition easy matches 1 as @s[type=brr:flood_room, name=easy_room3] at @s run structure load mystructure:EasyTunnelDoor2 ~8 ~20 ~3 270_degrees
execute if score r3_transition easy matches 10 as @s[type=brr:flood_room, name=easy_room3] at @s run structure load mystructure:EasyTunnelDoor1 ~8 ~20 ~3 270_degrees
execute if score r3_transition easy matches 10 as @s[type=brr:flood_room, name=easy_room3] at @s positioned ~ ~2 ~ run fill ~-6 ~1 ~-6 ~6 ~20 ~6 water
execute if score r3_transition easy matches 10 run scoreboard players set started4 easy 1
execute if score r3_transition easy matches 10.. run scoreboard players reset R3B1 easy
execute if score r3_transition easy matches 10.. run scoreboard players reset R3B2 easy
execute if score r3_transition easy matches 10.. run scoreboard players reset R3B3 easy
execute if score r3_transition easy matches 10.. run scoreboard players reset R3B4 easy
execute if score r3_transition easy matches 10.. run scoreboard players reset core easy
execute if score r3_transition easy matches 10.. run scoreboard players reset core1 easy
execute if score r3_transition easy matches 10.. run scoreboard players reset core_laser1 easy
execute if score r3_transition easy matches 10.. run scoreboard players reset core_laser2 easy
execute if score r3_transition easy matches 10.. run scoreboard players reset core_laser3 easy
execute if score r3_transition easy matches 10.. run scoreboard players reset core_laser4 easy
execute if score r3_transition easy matches 10.. run scoreboard players reset r3_timer_ms easy
execute if score r3_transition easy matches 10.. run scoreboard players reset r3_timer_s easy
execute if score r3_transition easy matches 10.. run scoreboard players reset r3_end easy
execute if score r3_transition easy matches 10.. run scoreboard players reset r3_transition easy


# // = Power Core Special =
# // Particles
execute if score core_laser1 easy matches 1 run particle brr:power_core_laser_beam3 ^ ^20 ^-4
execute if score core_laser1 easy matches 1 run particle brr:power_core_laser_spiral3 ^ ^20 ^-4
execute if score core_laser2 easy matches 1 run particle brr:power_core_laser_beam2 ^4 ^20 ^
execute if score core_laser2 easy matches 1 run particle brr:power_core_laser_spiral2 ^4 ^20 ^
execute if score core_laser3 easy matches 1 run particle brr:power_core_laser_beam4 ^ ^20 ^4
execute if score core_laser3 easy matches 1 run particle brr:power_core_laser_spiral4 ^ ^20 ^4
execute if score core_laser4 easy matches 1 run particle brr:power_core_laser_beam ^-4 ^20 ^
execute if score core_laser4 easy matches 1 run particle brr:power_core_laser_spiral ^-4 ^20 ^
# // Scores
execute if score core1 easy matches 0..2 run scoreboard players add core easy 1
# // Core animations
# // - Normal -
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score core1 easy matches 0 if score core easy matches 1 run structure load mystructure:Core1 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score core1 easy matches 0 if score core easy matches 25 run structure load mystructure:Core2 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score core1 easy matches 0 if score core easy matches 35 run structure load mystructure:Core3 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score core1 easy matches 0 if score core easy matches 50 run structure load mystructure:Core4 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score core1 easy matches 0 if score core easy matches 66 run structure load mystructure:Core3 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score core1 easy matches 0 if score core easy matches 80 run structure load mystructure:Core2 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score core1 easy matches 0 if score core easy matches 94.. run scoreboard players set core easy 0
# // - Hit by a blaster -
# // button 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if score core1 easy matches 1 if score core easy matches 1 run structure load mystructure:CoreEmpty ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if score core1 easy matches 1 if score core easy matches 1 run structure load mystructure:CoreHit1 ^-2 ^12 ^-2
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if score core1 easy matches 1 if score core easy matches 3 run structure load mystructure:CoreHit2 ^-2 ^12 ^-2
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if score core1 easy matches 1 if score core easy matches 7 run structure load mystructure:CoreHit3 ^-2 ^12 ^-2
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if score core1 easy matches 1 if score core easy matches 11 run structure load mystructure:CoreHit4 ^-2 ^12 ^-2
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if score core1 easy matches 1 if score core easy matches 15 run structure load mystructure:CoreHit5 ^-2 ^12 ^-2
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if score core1 easy matches 1 if score core easy matches 20 run structure load mystructure:Core5 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if score core1 easy matches 1 if score core easy matches 25 run structure load mystructure:Core1 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if score core1 easy matches 1 if score core easy matches 49 run scoreboard players reset core easy

# // button 2
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 0 if score core1 easy matches 1 if score core easy matches 1 run structure load mystructure:CoreEmpty ^-3 ^11 ^-3 90_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 0 if score core1 easy matches 1 if score core easy matches 1 run structure load mystructure:CoreHit1 ^-2 ^12 ^-2 90_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 0 if score core1 easy matches 1 if score core easy matches 3 run structure load mystructure:CoreHit2 ^-2 ^12 ^-2 90_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 0 if score core1 easy matches 1 if score core easy matches 7 run structure load mystructure:CoreHit3 ^-2 ^12 ^-2 90_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 0 if score core1 easy matches 1 if score core easy matches 11 run structure load mystructure:CoreHit4 ^-2 ^12 ^-2 90_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 0 if score core1 easy matches 1 if score core easy matches 15 run structure load mystructure:CoreHit5 ^-2 ^12 ^-2 90_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 0 if score core1 easy matches 1 if score core easy matches 20 run structure load mystructure:Core5 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 0 if score core1 easy matches 1 if score core easy matches 25 run structure load mystructure:Core1 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 0 if score core1 easy matches 1 if score core easy matches 49 run scoreboard players reset core easy
# // button 3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 0 if score core1 easy matches 1 if score core easy matches 1 run structure load mystructure:CoreEmpty ^-3 ^11 ^-3 180_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 0 if score core1 easy matches 1 if score core easy matches 1 run structure load mystructure:CoreHit1 ^-2 ^12 ^-2 180_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 0 if score core1 easy matches 1 if score core easy matches 3 run structure load mystructure:CoreHit2 ^-2 ^12 ^-2 180_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 0 if score core1 easy matches 1 if score core easy matches 7 run structure load mystructure:CoreHit3 ^-2 ^12 ^-2 180_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 0 if score core1 easy matches 1 if score core easy matches 11 run structure load mystructure:CoreHit4 ^-2 ^12 ^-2 180_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 0 if score core1 easy matches 1 if score core easy matches 15 run structure load mystructure:CoreHit5 ^-2 ^12 ^-2 180_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 0 if score core1 easy matches 1 if score core easy matches 20 run structure load mystructure:Core5 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 0 if score core1 easy matches 1 if score core easy matches 25 run structure load mystructure:Core1 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 0 if score core1 easy matches 1 if score core easy matches 49 run scoreboard players reset core easy
# // button 4
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 1 if score R3B4 easy matches 0 if score core1 easy matches 1 if score core easy matches 1 run structure load mystructure:CoreEmpty ^-3 ^11 ^-3 270_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 1 if score R3B4 easy matches 0 if score core1 easy matches 1 if score core easy matches 1 run structure load mystructure:CoreHit1 ^-2 ^12 ^-2 270_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 1 if score R3B4 easy matches 0 if score core1 easy matches 1 if score core easy matches 3 run structure load mystructure:CoreHit2 ^-2 ^12 ^-2 270_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 1 if score R3B4 easy matches 0 if score core1 easy matches 1 if score core easy matches 7 run structure load mystructure:CoreHit3 ^-2 ^12 ^-2 270_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 1 if score R3B4 easy matches 0 if score core1 easy matches 1 if score core easy matches 11 run structure load mystructure:CoreHit4 ^-2 ^12 ^-2 270_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 1 if score R3B4 easy matches 0 if score core1 easy matches 1 if score core easy matches 15 run structure load mystructure:CoreHit5 ^-2 ^12 ^-2 270_degrees
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 1 if score R3B4 easy matches 0 if score core1 easy matches 1 if score core easy matches 20 run structure load mystructure:Core3 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 1 if score R3B4 easy matches 0 if score core1 easy matches 1 if score core easy matches 25 run structure load mystructure:Core4 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 1 if score R3B4 easy matches 0 if score core1 easy matches 1 if score core easy matches 30 run structure load mystructure:Core3 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 1 if score R3B4 easy matches 0 if score core1 easy matches 1 if score core easy matches 40 run structure load mystructure:Core2 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 1 if score R3B4 easy matches 0 if score core1 easy matches 1 if score core easy matches 44 run structure load mystructure:Core1 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 1 if score R3B4 easy matches 0 if score core1 easy matches 1 if score core easy matches 49 run structure load mystructure:Core5 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 1 if score R3B4 easy matches 0 if score core1 easy matches 1 if score core easy matches 49 run tellraw @a[tag=easy] {"rawtext":[{"text": "§2Objective Complete: §aYou successfully stabilized the core!"}]}
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 1 if score R3B4 easy matches 0 if score core1 easy matches 1 if score core easy matches 55 run structure load mystructure:CoreStable ^-3 ^11 ^-3 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 1 if score R3B4 easy matches 0 if score core1 easy matches 1 if score core easy matches 60 run scoreboard players set core1 easy 3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B2 easy matches 1 if score R3B3 easy matches 1 if score R3B4 easy matches 0 if score core1 easy matches 3 if score core easy matches 60.. run scoreboard players reset core easy
# // - Game Over -
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score core1 easy matches 2 if score core easy matches 1 run tellraw @a[tag=easy] {"rawtext":[{"text": "§2Objective Failed: §4You failed to contain the core! "}]}
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score core1 easy matches 2 if score core easy matches 1 run structure load mystructure:CoreEmpty ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score core1 easy matches 2 if score core easy matches 1 run structure load mystructure:CoreCritical1 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score core1 easy matches 2 if score core easy matches 5 run structure load mystructure:CoreCritical2 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score core1 easy matches 2 if score core easy matches 11 run structure load mystructure:CoreCritical3 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score core1 easy matches 2 if score core easy matches 13 run structure load mystructure:CoreCritical4 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score core1 easy matches 2 if score core easy matches 15 run structure load mystructure:CoreCritical5 ^-3 ^11 ^-3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score core1 easy matches 2 if score core easy matches 17 run camera @a[tag=easy] fade time 0 3 3 color 144 0 0
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score core1 easy matches 2 if score core easy matches 19 run title @a[tag=easy] times 40 100 20
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score core1 easy matches 2 if score core easy matches 19 run title @a[tag=easy] title §4Game Over
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score core1 easy matches 2 if score core easy matches 35 run kill @a[tag=easy]
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score core1 easy matches 2 if score core easy matches 35 run tag @a[tag=easy] remove easy
# // kill parts
execute as @a[tag=easy] at @s if block ~ ~-1 ~ white_stained_glass run kill @s