# = SYSTEM RUN =
# - Level title -
execute as @a[tag=easy] at @s if score r1_timer_s easy matches 20 if score r1_timer_ms easy matches 10 if score started easy matches 1 run title @a[tag=easy] subtitle §2Alternative Way
execute as @a[tag=easy] at @s if score r1_timer_s easy matches 20 if score r1_timer_ms easy matches 10 if score started easy matches 1 run title @a[tag=easy] title §aROOM 1
execute as @a[tag=easy] at @s run tag @s add easy_music
# - Test for buttons -
# // Button 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 0 if block ^6 ^6 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players add R1B1a easy 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 0 if score R1B1a easy matches 1 if block ^6 ^6 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^-7 ^5 ^
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 0 if score R1B1a easy matches 3 if block ^6 ^6 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^-6 ^5 ^
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 0 if score R1B1a easy matches 5 if block ^6 ^6 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^-5 ^5 ^
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 0 if score R1B1a easy matches 7 if block ^6 ^6 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^-4 ^5 ^
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 0 if score R1B1a easy matches 9 if block ^6 ^6 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^-3 ^5 ^
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 0 if score R1B1a easy matches 11 if block ^6 ^6 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^-2 ^5 ^
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 0 if score R1B1a easy matches 13 if block ^6 ^6 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^-1 ^5 ^
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 0 if score R1B1a easy matches 15 if block ^6 ^6 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^ ^5 ^
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 0 if score R1B1a easy matches 17 if block ^6 ^6 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^1 ^5 ^
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 0 if score R1B1a easy matches 19 if block ^6 ^6 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^2 ^5 ^
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 0 if score R1B1a easy matches 21 if block ^6 ^6 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^3 ^5 ^
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 0 if score R1B1a easy matches 23 if block ^6 ^6 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^4 ^5 ^
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 0 if score R1B1a easy matches 25 if block ^6 ^6 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^5 ^5 ^
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 0 if score R1B1a easy matches 25 if block ^6 ^6 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run setblock ^-6 ^5 ^ polished_andesite
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 0 if score R1B1a easy matches 25.. if block ^6 ^6 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players set R1B1 easy 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 1 if score R1B1a easy matches 25.. if block ^6 ^6 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players reset R1B1a easy
# // Button 2
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B2 easy matches 0 if block ^-6 ^11 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players add R1B2a easy 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B2 easy matches 0 if score R1B2a easy matches 1 if block ^-6 ^11 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^6 ^10 ^ 180_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B2 easy matches 0 if score R1B2a easy matches 3 if block ^-6 ^11 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^5 ^10 ^ 180_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B2 easy matches 0 if score R1B2a easy matches 5 if block ^-6 ^11 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^4 ^10 ^ 180_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B2 easy matches 0 if score R1B2a easy matches 7 if block ^-6 ^11 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^3 ^10 ^ 180_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B2 easy matches 0 if score R1B2a easy matches 9 if block ^-6 ^11 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^2 ^10 ^ 180_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B2 easy matches 0 if score R1B2a easy matches 11 if block ^-6 ^11 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^1 ^10 ^ 180_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B2 easy matches 0 if score R1B2a easy matches 13 if block ^-6 ^11 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^ ^10 ^ 180_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B2 easy matches 0 if score R1B2a easy matches 15 if block ^-6 ^11 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^-1 ^10 ^ 180_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B2 easy matches 0 if score R1B2a easy matches 17 if block ^-6 ^11 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^-2 ^10 ^ 180_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B2 easy matches 0 if score R1B2a easy matches 19 if block ^-6 ^11 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^-3 ^10 ^ 180_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B2 easy matches 0 if score R1B2a easy matches 21 if block ^-6 ^11 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^-4 ^10 ^ 180_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B2 easy matches 0 if score R1B2a easy matches 23 if block ^-6 ^11 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^-5 ^10 ^ 180_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B2 easy matches 0 if score R1B2a easy matches 25 if block ^-6 ^11 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^-6 ^10 ^ 180_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B2 easy matches 0 if score R1B2a easy matches 25 if block ^-6 ^11 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run setblock ^6 ^10 ^ polished_andesite
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B2 easy matches 0 if score R1B2a easy matches 25.. if block ^-6 ^11 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players set R1B2 easy 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B2 easy matches 1 if score R1B2a easy matches 25.. if block ^-6 ^11 ^ brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players reset R1B2a easy
# // Exit Button
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B3 easy matches 0 if block ^ ^19 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players add R1B3a easy 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B3 easy matches 0 if score R1B3a easy matches 1 if block ^ ^19 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="south"] run fill ^3 ^18 ^7 ^4 ^18 ^7 air
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B3 easy matches 0 if score R1B3a easy matches 10 if block ^ ^19 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="south"] run fill ^3 ^19 ^7 ^4 ^19 ^7 air
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B3 easy matches 0 if score R1B3a easy matches 10 if block ^ ^19 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="south"] run tellraw @a[tag=easy] {"rawtext":[{"text": "§aTunnel Gate has been Opened!"}]}
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B3 easy matches 0 if score R1B3a easy matches 10.. if block ^ ^19 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players set R1B3 easy 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B3 easy matches 1 if score R1B3a easy matches 10.. if block ^ ^19 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players reset R1B3a easy
# // - Flooding -
execute if score started easy matches 1 if score p_game easy matches 1.. if score r1_end easy matches 0 run scoreboard players add r1_timer_ms easy 1
execute if score r1_timer_ms easy matches 20.. run scoreboard players remove r1_timer_s easy 1
execute if score r1_timer_ms easy matches 20.. run scoreboard players set r1_timer_ms easy 0
execute if score r1_timer_s easy matches ..0 run scoreboard players add flood1 easy 1
# // flood part
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 1 if score r1_timer_s easy matches 0 run tellraw @a[tag=easy] {"rawtext":[{"text":"§3Water is rising!"}]}
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 1 if score r1_timer_s easy matches 0 run structure load "easy/room1/4_alternative_way:EMR1V4F1" ~-6 ~2 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 2 if score r1_timer_s easy matches 0 run structure load "easy/room1/4_alternative_way:EMR1V4F2" ~-6 ~3 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 3 if score r1_timer_s easy matches 0 run structure load "easy/room1/4_alternative_way:EMR1V4F3" ~-6 ~4 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 4 if score r1_timer_s easy matches 0 run structure load "easy/room1/4_alternative_way:EMR1V4F4" ~-6 ~5 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 5 if score r1_timer_s easy matches 0 run structure load "easy/room1/4_alternative_way:EMR1V4F5" ~-6 ~6 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 6 if score r1_timer_s easy matches 0 run structure load "easy/room1/4_alternative_way:EMR1V4F6" ~-6 ~7 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 7 if score r1_timer_s easy matches 0 run structure load "easy/room1/4_alternative_way:EMR1V4F7" ~-6 ~8 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 8 if score r1_timer_s easy matches 0 run structure load "easy/room1/4_alternative_way:EMR1V4F8" ~-6 ~9 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 9 if score r1_timer_s easy matches 0 run structure load "easy/room1/4_alternative_way:EMR1V4F9" ~-6 ~10 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 10 if score r1_timer_s easy matches 0 run structure load "easy/room1/4_alternative_way:EMR1V4F10" ~-6 ~11 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 11 if score r1_timer_s easy matches 0 run structure load "easy/room1/4_alternative_way:EMR1V4F11" ~-6 ~12 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 12 if score r1_timer_s easy matches 0 run structure load "easy/room1/4_alternative_way:EMR1V4F12" ~-6 ~13 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 13 if score r1_timer_s easy matches 0 run structure load "easy/room1/4_alternative_way:EMR1V4F13" ~-6 ~14 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 14 if score r1_timer_s easy matches 0 run structure load "easy/room1/4_alternative_way:EMR1V4F14" ~-6 ~15 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 15 if score r1_timer_s easy matches 0 run structure load "easy/room1/4_alternative_way:EMR1V4F15" ~-6 ~16 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 16 if score r1_timer_s easy matches 0 run structure load "easy/room1/4_alternative_way:EMR1V4F16" ~-6 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 17 if score r1_timer_s easy matches 0 run structure load "easy/room1/4_alternative_way:EMR1V4F17" ~-6 ~18 ~-6 0_degrees none block_by_block 1
# // flood end
execute if score r1_timer_s easy matches ..0 run scoreboard players set r1_timer_s easy 4
execute if score flood1 easy matches 17 if score r1_timer_ms easy matches 10 run scoreboard players set r1_end easy 1
# // exit tunnel
execute as @s[type=brr:flood_room, name=easy_room1] at @s run tag @a[tag=easy, x=~3, y=~18, z=~9, dx=1, dy=1, dz=4] add easytunnel1
execute as @s[type=brr:flood_room, name=easy_room1] at @s run tag @a[tag=easy, x=~3, y=~18, z=~7, dx=1, dy=1, dz=0] remove easytunnel1
# // exit player count
scoreboard players set p_tunnel1 easy 0
execute as @a[tag=easytunnel1] at @s run scoreboard players add p_tunnel1 easy 1
# // transition into room 2
execute if score p_tunnel1 easy = p_game easy if score started2 easy matches 0 run scoreboard players set r1_end easy 1
execute if score r1_end easy matches 1 unless score started2 easy matches 1 run scoreboard players add r1_transition easy 1
execute if score r1_transition easy matches 1 as @s[type=brr:flood_room, name=easy_room1] at @s run playsound sfx.doors.opened @a[tag=easy] ~3 ~18 ~8 1 0.7
execute if score r1_transition easy matches 1 as @s[type=brr:flood_room, name=easy_room1] at @s run structure load "easy:EasyTunnelDoor2" ~3 ~18 ~8
execute if score r1_transition easy matches 10 as @s[type=brr:flood_room, name=easy_room1] at @s run structure load "easy:EasyTunnelDoor1" ~3 ~18 ~8
execute if score r1_transition easy matches 10 as @s[type=brr:flood_room, name=easy_room1] at @s positioned ~ ~2 ~ run fill ~-6 ~ ~-6 ~6 ~19 ~6 water
execute if score r1_transition easy matches 10 run scoreboard players set started2 easy 1
execute if score r1_transition easy matches 10.. run scoreboard players reset R1B1 easy
execute if score r1_transition easy matches 10.. run scoreboard players reset R1B2 easy
execute if score r1_transition easy matches 10.. run scoreboard players reset R1B3 easy
execute if score r1_transition easy matches 10.. run scoreboard players reset r1_timer_ms easy
execute if score r1_transition easy matches 10.. run scoreboard players reset r1_timer_s easy
execute if score r1_transition easy matches 10.. run scoreboard players reset r1_end easy
execute if score r1_transition easy matches 10.. run scoreboard players reset r1_transition easy