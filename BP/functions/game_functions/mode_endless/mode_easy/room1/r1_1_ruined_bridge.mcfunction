# = SYSTEM RUN =
# - Level title -
execute as @a[tag=endless] at @s if score endless_timer_s endless matches 20 if score endless_timer_ms endless matches 10 if score started endless matches 1 run title @a[tag=endless] subtitle §2Ruined Bridge
execute as @a[tag=endless] at @s if score endless_timer_s endless matches 20 if score endless_timer_ms endless matches 10 if score started endless matches 1 run titleraw @a[tag=endless] title {"rawtext":[{"text": "§aROOM "}, {"score":{"name": "room_count", "objective": "endless"}}]}
execute as @a[tag=endless] at @s run tag @s add endless_music
# - Test for buttons -
# // Button 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 0 if block ^6 ^6 ^5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run structure load "easy/room1/1_ruined_bridge:EMR1V1M1" ^-2 ^2 ^-5 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 0 if block ^6 ^6 ^5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players set R1B1 endless 1
# // Button 2
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if block ^-6 ^7 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room1/1_ruined_bridge:EMR1V1M2" ^4 ^7 ^-6 0_degrees none block_by_block 2
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if block ^-6 ^7 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set R1B2 endless 1
# // Button 3
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B3 endless matches 0 if block ^6 ^14 ^-2 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R1B3a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B3 endless matches 0 if score R1B3a endless matches 1 if block ^6 ^14 ^-2 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room1/1_ruined_bridge:EMR1V1M3a" ^-1 ^13 ^6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B3 endless matches 0 if score R1B3a endless matches 10 if block ^6 ^14 ^-2 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room1/1_ruined_bridge:EMR1V1M3" ^-1 ^13 ^5 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B3 endless matches 0 if score R1B3a endless matches 10.. if block ^6 ^14 ^-2 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set R1B3 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B3 endless matches 1 if score R1B3a endless matches 10.. if block ^6 ^14 ^-2 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players reset R1B3a endless
# // Exit Button
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 0 if block ^-6 ^20 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="down"] run scoreboard players add R1B4a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 0 if score R1B4a endless matches 1 if block ^-6 ^20 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="down"] run fill ^3 ^18 ^7 ^4 ^18 ^7 air
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 0 if score R1B4a endless matches 10 if block ^-6 ^20 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="down"] run fill ^3 ^19 ^7 ^4 ^19 ^7 air
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 0 if score R1B4a endless matches 10 if block ^-6 ^20 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="down"] run tellraw @a[tag=endless] {"rawtext":[{"text": "§aTunnel Gate has been Opened!"}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 0 if score R1B4a endless matches 10.. if block ^-6 ^20 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="down"] run scoreboard players set R1B4 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 1 if score R1B4a endless matches 10.. if block ^-6 ^20 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="down"] run scoreboard players reset R1B4a endless
# // - Flooding -
execute if score started endless matches 1 if score p_game endless matches 1.. if score endless_end endless matches 0 run scoreboard players add endless_timer_ms endless 1
execute if score endless_timer_ms endless matches 20.. run scoreboard players remove endless_timer_s endless 1
execute if score endless_timer_ms endless matches 20.. run scoreboard players set endless_timer_ms endless 0
execute if score endless_timer_s endless matches ..0 run scoreboard players add flood endless 1
# // flood part
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 0 run tellraw @a[tag=endless] {"rawtext":[{"text":"§3Water is rising!"}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 0 run structure load "easy/room1/1_ruined_bridge:EMR1V1F1" ~-6 ~2 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 2 if score endless_timer_s endless matches 0 run structure load "easy/room1/1_ruined_bridge:EMR1V1F2" ~-6 ~3 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 3 if score endless_timer_s endless matches 0 run structure load "easy/room1/1_ruined_bridge:EMR1V1F3" ~-6 ~4 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 4 if score endless_timer_s endless matches 0 run structure load "easy/room1/1_ruined_bridge:EMR1V1F4" ~-6 ~5 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 5 if score endless_timer_s endless matches 0 run structure load "easy/room1/1_ruined_bridge:EMR1V1F5" ~-6 ~6 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 6 if score endless_timer_s endless matches 0 run structure load "easy/room1/1_ruined_bridge:EMR1V1F6" ~-6 ~7 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 7 if score endless_timer_s endless matches 0 run structure load "easy/room1/1_ruined_bridge:EMR1V1F7" ~-6 ~8 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 8 if score endless_timer_s endless matches 0 run structure load "easy/room1/1_ruined_bridge:EMR1V1F8" ~-6 ~9 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 9 if score endless_timer_s endless matches 0 run structure load "easy/room1/1_ruined_bridge:EMR1V1F9" ~-6 ~10 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 10 if score endless_timer_s endless matches 0 run structure load "easy/room1/1_ruined_bridge:EMR1V1F10" ~-6 ~11 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 11 if score endless_timer_s endless matches 0 run structure load "easy/room1/1_ruined_bridge:EMR1V1F11" ~-6 ~12 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 12 if score endless_timer_s endless matches 0 run structure load "easy/room1/1_ruined_bridge:EMR1V1F12" ~-6 ~13 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 13 if score endless_timer_s endless matches 0 run structure load "easy/room1/1_ruined_bridge:EMR1V1F13" ~-6 ~14 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 14 if score endless_timer_s endless matches 0 run structure load "easy/room1/1_ruined_bridge:EMR1V1F14" ~-6 ~15 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 15 if score endless_timer_s endless matches 0 run structure load "easy/room1/1_ruined_bridge:EMR1V1F15" ~-6 ~16 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 16 if score endless_timer_s endless matches 0 run structure load "easy/room1/1_ruined_bridge:EMR1V1F16" ~-6 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 17 if score endless_timer_s endless matches 0 run structure load "easy/room1/1_ruined_bridge:EMR1V1F17" ~-6 ~18 ~-6 0_degrees none block_by_block 1
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