# = SYSTEM RUN =
# - Level title -
execute as @a[tag=easy] at @s if score r1_timer_s easy matches 31 if score r1_timer_ms easy matches 10 if score started easy matches 1 run title @a[tag=easy] subtitle §2Thin Glass
execute as @a[tag=easy] at @s if score r1_timer_s easy matches 31 if score r1_timer_ms easy matches 10 if score started easy matches 1 run title @a[tag=easy] title §aROOM 1
execute as @a[tag=easy] at @s run tag @s add easy_music
# - Glass Destroy -
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score r1_timer_s easy matches 31 if score r1_timer_ms easy matches 5 if score started easy matches 1 run fill ^-2 ^7 ^-3 ^2 ^8 ^3 air destroy
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score r1_timer_s easy matches 31 if score r1_timer_ms easy matches 5 if score started easy matches 1 run playsound sfx.glassbreaking @a[tag=easy]
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score r1_timer_s easy matches 30 if score r1_timer_ms easy matches 5 if score started easy matches 1 run structure load "easy/room1/8_cb_thin_glass:EMR1V8M1" ~-2 ~7 ~-3 0_degrees none block_by_block 2
# - Test for buttons -
# // Exit Button
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 0 if block ^ ^8 ^ brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set R1B1 easy 2
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 run scoreboard players add R1B1a easy 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 if score R1B1a easy matches 1 run playsound sfx.moving_part.start @a[tag=easy]
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 if score R1B1a easy matches 1 run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^ ^12 ^6 270_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 if score R1B1a easy matches 3 run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^ ^12 ^5 270_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 if score R1B1a easy matches 5 run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^ ^12 ^4 270_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 if score R1B1a easy matches 7 run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^ ^12 ^3 270_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 if score R1B1a easy matches 9 run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^ ^12 ^2 270_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 if score R1B1a easy matches 11 run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^ ^12 ^1 270_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 if score R1B1a easy matches 13 run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^ ^12 ^ 270_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 if score R1B1a easy matches 15 run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^ ^12 ^-1 270_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 if score R1B1a easy matches 17 run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^ ^12 ^-2 270_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 if score R1B1a easy matches 19 run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^ ^12 ^-3 270_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 if score R1B1a easy matches 21 run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^ ^12 ^-4 270_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 if score R1B1a easy matches 23 run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^ ^12 ^-5 270_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 if score R1B1a easy matches 25 run structure load "easy/room1/4_alternative_way:EMR1V4M1" ^ ^12 ^-6 270_degrees
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 if score R1B1a easy matches 25 run setblock ^ ^12 ^6  polished_andesite
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 if score R1B1a easy matches 25 run stopsound @a[tag=easy] sfx.moving_part.start
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 if score R1B1a easy matches 25 run playsound sfx.moving_part.stop @a[tag=easy]
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 if score R1B1a easy matches 1 run fill ^-2 ^7 ^-3 ^2 ^8 ^3 air destroy
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 if score R1B1a easy matches 1 run fill ^3 ^18 ^7 ^4 ^18 ^7 air
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 if score R1B1a easy matches 10 run fill ^3 ^19 ^7 ^4 ^19 ^7 air
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 if score R1B1a easy matches 10 run tellraw @a[tag=easy] {"rawtext":[{"text": "§aTunnel Gate has been Opened!"}]}
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 2 if score R1B1a easy matches 25.. run scoreboard players set R1B1 easy 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score R1B1 easy matches 1 if score R1B1a easy matches 25.. run scoreboard players reset R1B1a easy
# // - Flooding -
execute if score started easy matches 1 if score p_game easy matches 1.. if score r1_end easy matches 0 run scoreboard players add r1_timer_ms easy 1
execute if score r1_timer_ms easy matches 20.. run scoreboard players remove r1_timer_s easy 1
execute if score r1_timer_ms easy matches 20.. run scoreboard players set r1_timer_ms easy 0
execute if score r1_timer_s easy matches ..0 run scoreboard players add flood1 easy 1
# // flood part
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 1 if score r1_timer_s easy matches 0 run tellraw @a[tag=easy] {"rawtext":[{"text":"§3Water is rising!"}]}
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 1 if score r1_timer_s easy matches 0 run structure load "easy/room1/8_cb_thin_glass:EMR1V8F1" ~-6 ~2 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 2 if score r1_timer_s easy matches 0 run structure load "easy/room1/8_cb_thin_glass:EMR1V8F2" ~-6 ~3 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 3 if score r1_timer_s easy matches 0 run structure load "easy/room1/8_cb_thin_glass:EMR1V8F3" ~-6 ~4 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 4 if score r1_timer_s easy matches 0 run structure load "easy/room1/8_cb_thin_glass:EMR1V8F4" ~-6 ~5 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 5 if score r1_timer_s easy matches 0 run structure load "easy/room1/8_cb_thin_glass:EMR1V8F5" ~-6 ~6 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 6 if score r1_timer_s easy matches 0 run structure load "easy/room1/8_cb_thin_glass:EMR1V8F6" ~-6 ~7 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 7 if score r1_timer_s easy matches 0 run structure load "easy/room1/8_cb_thin_glass:EMR1V8F7" ~-6 ~8 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 8 if score r1_timer_s easy matches 0 run structure load "easy/room1/8_cb_thin_glass:EMR1V8F8" ~-6 ~9 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 9 if score r1_timer_s easy matches 0 run structure load "easy/room1/8_cb_thin_glass:EMR1V8F9" ~-6 ~10 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 10 if score r1_timer_s easy matches 0 run structure load "easy/room1/8_cb_thin_glass:EMR1V8F10" ~-6 ~11 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 11 if score r1_timer_s easy matches 0 run structure load "easy/room1/8_cb_thin_glass:EMR1V8F11" ~-6 ~12 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 12 if score r1_timer_s easy matches 0 run structure load "easy/room1/8_cb_thin_glass:EMR1V8F12" ~-6 ~13 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 13 if score r1_timer_s easy matches 0 run structure load "easy/room1/8_cb_thin_glass:EMR1V8F13" ~-6 ~14 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 14 if score r1_timer_s easy matches 0 run structure load "easy/room1/8_cb_thin_glass:EMR1V8F14" ~-6 ~15 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 15 if score r1_timer_s easy matches 0 run structure load "easy/room1/8_cb_thin_glass:EMR1V8F15" ~-6 ~16 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 16 if score r1_timer_s easy matches 0 run structure load "easy/room1/8_cb_thin_glass:EMR1V8F16" ~-6 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room1] at @s if score flood1 easy matches 17 if score r1_timer_s easy matches 0 run structure load "easy/room1/8_cb_thin_glass:EMR1V8F17" ~-6 ~18 ~-6 0_degrees none block_by_block 1
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
execute if score r1_transition easy matches 10.. run scoreboard players reset r1_timer_ms easy
execute if score r1_transition easy matches 10.. run scoreboard players reset r1_timer_s easy
execute if score r1_transition easy matches 10.. run scoreboard players reset r1_end easy
execute if score r1_transition easy matches 10.. run scoreboard players reset r1_transition easy