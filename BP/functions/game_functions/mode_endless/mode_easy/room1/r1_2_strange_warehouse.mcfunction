# = SYSTEM RUN =
# - Level title -
execute as @a[tag=endless] at @s if score endless_timer_s endless matches 20 if score endless_timer_ms endless matches 10 if score started endless matches 1 run title @a[tag=endless] subtitle §2Warehouse
execute as @a[tag=endless] at @s if score endless_timer_s endless matches 20 if score endless_timer_ms endless matches 10 if score started endless matches 1 run titleraw @a[tag=endless] title {"rawtext":[{"text": "§aROOM "}, {"score":{"name": "room_count", "objective": "endless"}}]}
execute as @a[tag=endless] at @s run tag @s add endless_music
# - Test for buttons -
# // Button 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 0 if block ^6 ^2 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R1B1a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 0 if score R1B1a endless matches 1 if block ^6 ^2 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run playsound sfx.doors.tunnelopen @a[tag=endless] ^-3 ^3 ^4.5
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 0 if score R1B1a endless matches 1 if block ^6 ^2 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room1/2_warehouse:EMR1V2M1" ^-3 ^2 ^4
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 0 if score R1B1a endless matches 3 if block ^6 ^2 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room1/2_warehouse:EMR1V2M1a" ^-3 ^2 ^4
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 0 if score R1B1a endless matches 5 if block ^6 ^2 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room1/2_warehouse:EMR1V2M1b" ^-3 ^2 ^4
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 0 if score R1B1a endless matches 5.. if block ^6 ^2 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set R1B1 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 1 if score R1B1a endless matches 5.. if block ^6 ^2 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players reset R1B1a endless
# // Button 2
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if block ^-6 ^3 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players add R1B2a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if score R1B2a endless matches 1 if block ^-6 ^3 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run playsound sfx.doors.tunnelopen @a[tag=endless] ^-3 ^3 ^-4.5
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if score R1B2a endless matches 1 if block ^-6 ^3 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run structure load "easy/room1/2_warehouse:EMR1V2M1" ^-3 ^2 ^-5
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if score R1B2a endless matches 3 if block ^-6 ^3 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run structure load "easy/room1/2_warehouse:EMR1V2M1a" ^-3 ^2 ^-5
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if score R1B2a endless matches 5 if block ^-6 ^3 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run structure load "easy/room1/2_warehouse:EMR1V2M1b" ^-3 ^2 ^-5
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if score R1B2a endless matches 5.. if block ^-6 ^3 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players set R1B2 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 1 if score R1B2a endless matches 5.. if block ^-6 ^3 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players reset R1B2a endless
# // Button 3
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B3 endless matches 0 if block ^-6 ^3 ^-3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run structure load "easy/room1/2_warehouse:EMR1V2M2" ^-6 ^4 ^-1 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B3 endless matches 0 if block ^-6 ^3 ^-3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run scoreboard players set R1B3 endless 1
# // Button 4
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 0 if block ^6 ^11 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R1B4a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 0 if score R1B4a endless matches 1 if block ^6 ^11 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room1/2_warehouse:EMR1V2M3" ^-5 ^5 ^-6
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 0 if score R1B4a endless matches 4 if block ^6 ^11 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room1/2_warehouse:EMR1V2M3a" ^-5 ^5 ^-6
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 0 if score R1B4a endless matches 7 if block ^6 ^11 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room1/2_warehouse:EMR1V2M3b" ^-5 ^5 ^-6
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 0 if score R1B4a endless matches 7.. if block ^6 ^11 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set R1B4 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 1 if score R1B4a endless matches 7.. if block ^6 ^11 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players reset R1B4a endless
# // Button 5
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B5 endless matches 0 if block ^-6 ^16 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load "easy/room1/2_warehouse:EMR1V2M4" ^-4 ^13 ^-4 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B5 endless matches 0 if block ^-6 ^16 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players set R1B5 endless 1
# // Exit Button
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B6 endless matches 0 if block ^-6 ^18 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="north"] run scoreboard players add R1B6a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B6 endless matches 0 if score R1B6a endless matches 1 if block ^-6 ^18 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="north"] run structure load "easy/room1/2_warehouse:EMR1V2M5" ^6 ^16 ^-3 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B6 endless matches 0 if score R1B6a endless matches 1 if block ^-6 ^18 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="north"] run fill ^3 ^18 ^7 ^4 ^18 ^7 air
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B6 endless matches 0 if score R1B6a endless matches 10 if block ^-6 ^18 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="north"] run fill ^3 ^19 ^7 ^4 ^19 ^7 air
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B6 endless matches 0 if score R1B6a endless matches 10 if block ^-6 ^18 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="north"] run tellraw @a[tag=endless] {"rawtext":[{"text": "§aTunnel Gate has been Opened!"}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B6 endless matches 0 if score R1B6a endless matches 10.. if block ^-6 ^18 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="north"] run scoreboard players set R1B6 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B6 endless matches 1 if score R1B6a endless matches 10.. if block ^-6 ^18 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="north"] run scoreboard players reset R1B6a endless
# // - Flooding -
execute if score started endless matches 1 if score p_game endless matches 1.. if score endless_end endless matches 0 run scoreboard players add endless_timer_ms endless 1
execute if score endless_timer_ms endless matches 20.. run scoreboard players remove endless_timer_s endless 1
execute if score endless_timer_ms endless matches 20.. run scoreboard players set endless_timer_ms endless 0
execute if score endless_timer_s endless matches ..0 run scoreboard players add flood endless 1
# // flood part
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 0 run tellraw @a[tag=endless] {"rawtext":[{"text":"§3Water is rising!"}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 0 run structure load "easy/room1/2_warehouse:EMR1V2F1" ~-6 ~2 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 2 if score endless_timer_s endless matches 0 run structure load "easy/room1/2_warehouse:EMR1V2F2" ~-6 ~3 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 3 if score endless_timer_s endless matches 0 run structure load "easy/room1/2_warehouse:EMR1V2F3" ~-6 ~4 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 4 if score endless_timer_s endless matches 0 run structure load "easy/room1/2_warehouse:EMR1V2F4" ~-6 ~5 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 5 if score endless_timer_s endless matches 0 run structure load "easy/room1/2_warehouse:EMR1V2F5" ~-6 ~6 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 6 if score endless_timer_s endless matches 0 run structure load "easy/room1/2_warehouse:EMR1V2F6" ~-6 ~7 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 7 if score endless_timer_s endless matches 0 run structure load "easy/room1/2_warehouse:EMR1V2F7" ~-6 ~8 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 8 if score endless_timer_s endless matches 0 run structure load "easy/room1/2_warehouse:EMR1V2F8" ~-6 ~9 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 9 if score endless_timer_s endless matches 0 run structure load "easy/room1/2_warehouse:EMR1V2F9" ~-6 ~10 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 10 if score endless_timer_s endless matches 0 run structure load "easy/room1/2_warehouse:EMR1V2F10" ~-6 ~11 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 11 if score endless_timer_s endless matches 0 run structure load "easy/room1/2_warehouse:EMR1V2F11" ~-6 ~12 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 12 if score endless_timer_s endless matches 0 run structure load "easy/room1/2_warehouse:EMR1V2F12" ~-6 ~13 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 13 if score endless_timer_s endless matches 0 run structure load "easy/room1/2_warehouse:EMR1V2F13" ~-6 ~14 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 14 if score endless_timer_s endless matches 0 run structure load "easy/room1/2_warehouse:EMR1V2F14" ~-6 ~15 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 15 if score endless_timer_s endless matches 0 run structure load "easy/room1/2_warehouse:EMR1V2F15" ~-6 ~16 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 16 if score endless_timer_s endless matches 0 run structure load "easy/room1/2_warehouse:EMR1V2F16" ~-6 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 17 if score endless_timer_s endless matches 0 run structure load "easy/room1/2_warehouse:EMR1V2F17" ~-6 ~18 ~-6 0_degrees none block_by_block 1
# // flood end
execute if score endless_timer_s endless matches ..0 run scoreboard players set endless_timer_s endless 4
execute if score flood endless matches 17 if score endless_timer_ms endless matches 10 run scoreboard players set endless_end endless 1
# // exit tunnel
execute as @s[type=brr:flood_room, name=endless] at @s run tag @a[tag=endless, x=~3, y=~18, z=~9, dx=1, dy=1, dz=4] add endlesstunnel
execute as @s[type=brr:flood_room, name=endless] at @s run tag @a[tag=endless, x=~3, y=~18, z=~7, dx=1, dy=1, dz=0] remove endlesstunnel
# // exit player count
scoreboard players set p_tunnel endless 0
execute as @a[tag=endlesstunnel] at @s run scoreboard players add p_tunnel endless 1
# // transition into room 2
execute if score p_tunnel endless = p_game endless run scoreboard players set endless_end endless 1
execute if score endless_end endless matches 1 run scoreboard players add endless_transition endless 1
execute if score endless_transition endless matches 1 as @s[type=brr:flood_room, name=endless] at @s run playsound sfx.doors.opened @a[tag=endless] ~3 ~18 ~8 1 0.7
execute if score endless_transition endless matches 1 as @s[type=brr:flood_room, name=endless] at @s run structure load "easy:EasyTunnelDoor2" ~3 ~18 ~8
execute if score endless_transition endless matches 10 as @s[type=brr:flood_room, name=endless] at @s run structure load "easy:EasyTunnelDoor1" ~3 ~18 ~8
execute if score endless_transition endless matches 10 as @s[type=brr:flood_room, name=endless] at @s positioned ~ ~2 ~ run fill ~-6 ~ ~-6 ~6 ~19 ~6 water
execute if score endless_transition endless matches 31.. run function game_functions/mode_endless/reset_room