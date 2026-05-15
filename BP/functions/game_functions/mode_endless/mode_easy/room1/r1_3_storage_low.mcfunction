# = SYSTEM RUN =
# - Level title -
execute as @a[tag=endless] at @s if score endless_timer_s endless matches 20 if score endless_timer_ms endless matches 10 if score started endless matches 1 run title @a[tag=endless] subtitle Â§2Storage Low
execute as @a[tag=endless] at @s if score endless_timer_s endless matches 20 if score endless_timer_ms endless matches 10 if score started endless matches 1 run titleraw @a[tag=endless] title {"rawtext":[{"text": "Â§aROOM "}, {"score":{"name": "room_count", "objective": "endless"}}]}
execute as @a[tag=endless] at @s run tag @s add endless_music
# - Test for buttons -
# // Button 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 0 if block ^-3 ^5 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players add R1B1a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 0 if score R1B1a endless matches 1 if block ^-3 ^5 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run structure load "easy/room1/3_storage_low:EMR1V3M1" ^6 ^6 ^-1 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 0 if score R1B1a endless matches 10 if block ^-3 ^5 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run structure load "easy/room1/3_storage_low:EMR1V3M1a" ^5 ^6 ^-1 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 0 if score R1B1a endless matches 1 if block ^-3 ^5 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run structure load "easy/room1/3_storage_low:EMR1V3M1b" ^1 ^4 ^-6
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 0 if score R1B1a endless matches 10 if block ^-3 ^5 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run structure load "easy/room1/3_storage_low:EMR1V3M1c" ^1 ^4 ^-6
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 0 if score R1B1a endless matches 10.. if block ^-3 ^5 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players set R1B1 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 1 if score R1B1a endless matches 10.. if block ^-3 ^5 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players reset R1B1a endless
# // Exit Button
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if block ^6 ^21 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players add R1B2a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if score R1B2a endless matches 1 if block ^6 ^21 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="west"] run structure load "easy/room1/3_storage_low:EMR1V3M2" ^6 ^18 ^-2 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if score R1B2a endless matches 10 if block ^6 ^21 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="west"] run structure load "easy/room1/3_storage_low:EMR1V3M2a" ^5 ^18 ^-2 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if score R1B2a endless matches 1 if block ^6 ^21 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="west"] run structure load "easy/room1/3_storage_low:EMR1V3M2b" ^2 ^16 ^5 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if score R1B2a endless matches 10 if block ^6 ^21 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="west"] run structure load "easy/room1/3_storage_low:EMR1V3M2c" ^2 ^16 ^5 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if score R1B2a endless matches 1 if block ^6 ^21 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="west"] run fill ^3 ^18 ^7 ^4 ^18 ^7 air
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if score R1B2a endless matches 10 if block ^6 ^21 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="west"] run fill ^3 ^19 ^7 ^4 ^19 ^7 air
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if score R1B2a endless matches 10 if block ^6 ^21 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="west"] run tellraw @a[tag=endless] {"rawtext":[{"text": "Â§aTunnel Gate has been Opened!"}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if score R1B2a endless matches 10.. if block ^6 ^21 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players set R1B2 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 1 if score R1B2a endless matches 10.. if block ^6 ^21 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players reset R1B2a endless
# // - Flooding -
execute if score started endless matches 1 if score p_game endless matches 1.. if score endless_end endless matches 0 run scoreboard players add endless_timer_ms endless 1
execute if score endless_timer_ms endless matches 20.. run scoreboard players remove endless_timer_s endless 1
execute if score endless_timer_ms endless matches 20.. run scoreboard players set endless_timer_ms endless 0
execute if score endless_timer_s endless matches ..0 run scoreboard players add flood endless 1
# // flood part
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 0 run tellraw @a[tag=endless] {"rawtext":[{"text":"Â§3Water is rising!"}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 0 run structure load "easy/room1/3_storage_low:EMR1V3F1" ~-6 ~2 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 2 if score endless_timer_s endless matches 0 run structure load "easy/room1/3_storage_low:EMR1V3F2" ~-6 ~3 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 3 if score endless_timer_s endless matches 0 run structure load "easy/room1/3_storage_low:EMR1V3F3" ~-6 ~4 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 4 if score endless_timer_s endless matches 0 run structure load "easy/room1/3_storage_low:EMR1V3F4" ~-6 ~5 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 5 if score endless_timer_s endless matches 0 run structure load "easy/room1/3_storage_low:EMR1V3F5" ~-6 ~6 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 6 if score endless_timer_s endless matches 0 run structure load "easy/room1/3_storage_low:EMR1V3F6" ~-6 ~7 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 7 if score endless_timer_s endless matches 0 run structure load "easy/room1/3_storage_low:EMR1V3F7" ~-6 ~8 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 8 if score endless_timer_s endless matches 0 run structure load "easy/room1/3_storage_low:EMR1V3F8" ~-6 ~9 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 9 if score endless_timer_s endless matches 0 run structure load "easy/room1/3_storage_low:EMR1V3F9" ~-6 ~10 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 10 if score endless_timer_s endless matches 0 run structure load "easy/room1/3_storage_low:EMR1V3F10" ~-6 ~11 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 11 if score endless_timer_s endless matches 0 run structure load "easy/room1/3_storage_low:EMR1V3F11" ~-6 ~12 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 12 if score endless_timer_s endless matches 0 run structure load "easy/room1/3_storage_low:EMR1V3F12" ~-6 ~13 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 13 if score endless_timer_s endless matches 0 run structure load "easy/room1/3_storage_low:EMR1V3F13" ~-6 ~14 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 14 if score endless_timer_s endless matches 0 run structure load "easy/room1/3_storage_low:EMR1V3F14" ~-6 ~15 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 15 if score endless_timer_s endless matches 0 run structure load "easy/room1/3_storage_low:EMR1V3F15" ~-6 ~16 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 16 if score endless_timer_s endless matches 0 run structure load "easy/room1/3_storage_low:EMR1V3F16" ~-6 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 17 if score endless_timer_s endless matches 0 run structure load "easy/room1/3_storage_low:EMR1V3F17" ~-6 ~18 ~-6 0_degrees none block_by_block 1
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