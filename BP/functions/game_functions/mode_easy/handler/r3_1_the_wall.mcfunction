# = SYSTEM RUN =
# - Open entrance door -
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score started3 easy matches 1 if score r3_timer_s easy matches 21 if score r3_timer_ms easy matches 1 run structure load "easy:EasyTunnelDoor2" ~3 ~2 ~-8
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score started3 easy matches 1 if score r3_timer_s easy matches 21 if score r3_timer_ms easy matches 10 run structure load "easy:EasyTunnelDoor3" ~3 ~2 ~-8
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score started3 easy matches 1 if score r3_timer_s easy matches 21 if score r3_timer_ms easy matches 10 run playsound sfx.doors.tunnelopen @a[tag=easy] ~3.5 ~3 ~-8
# - Level title -
execute as @a[tag=easy] at @s if score r3_timer_s easy matches 21 if score r3_timer_ms easy matches 10 if score started3 easy matches 1 run title @a[tag=easy] subtitle §2The Wall
execute as @a[tag=easy] at @s if score r3_timer_s easy matches 21 if score r3_timer_ms easy matches 10 if score started3 easy matches 1 run title @a[tag=easy] title §aROOM 3
# - Test for buttons -
# // Button 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if block ^-2 ^5 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R3B1a easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if score R3B1a easy matches 1 if block ^-2 ^5 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run playsound sfx.doors.tunnelopen @a[tag=easy] ^3.5 ^3 ^
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if score R3B1a easy matches 1 if block ^-2 ^5 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room3/1_the_wall:EMR3V1M1" ^3 ^2 ^
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if score R3B1a easy matches 2 if block ^-2 ^5 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room3/1_the_wall:EMR3V1M1a" ^3 ^2 ^
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if score R3B1a easy matches 5 if block ^-2 ^5 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room3/1_the_wall:EMR3V1M1b" ^3 ^2 ^
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 0 if score R3B1a easy matches 5.. if block ^-2 ^5 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set R3B1 easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B1 easy matches 1 if score R3B1a easy matches 5.. if block ^-2 ^5 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players reset R3B1a easy
# // Button 2
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B2 easy matches 0 if block ^5 ^10 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run scoreboard players add R3B2a easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B2 easy matches 0 if score R3B2a easy matches 1 if block ^5 ^10 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run playsound sfx.doors.tunnelopen @a[tag=easy] ^-3.5 ^10 ^
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B2 easy matches 0 if score R3B2a easy matches 1 if block ^5 ^10 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run structure load "easy/room3/1_the_wall:EMR3V1M1" ^-4 ^9 ^
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B2 easy matches 0 if score R3B2a easy matches 2 if block ^5 ^10 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run structure load "easy/room3/1_the_wall:EMR3V1M1a" ^-4 ^9 ^
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B2 easy matches 0 if score R3B2a easy matches 5 if block ^5 ^10 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run structure load "easy/room3/1_the_wall:EMR3V1M1b" ^-4 ^9 ^
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B2 easy matches 0 if score R3B2a easy matches 5.. if block ^5 ^10 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run scoreboard players set R3B2 easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B2 easy matches 1 if score R3B2a easy matches 5.. if block ^5 ^10 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run scoreboard players reset R3B2a easy
# // Button 3
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B3 easy matches 0 if block ^-6 ^20 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players add R3B3a easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B3 easy matches 0 if score R3B3a easy matches 1 if block ^-6 ^20 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run fill ^-5 ^19 ^4 ^-6 ^20 ^4 air destroy
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B3 easy matches 0 if score R3B3a easy matches 1 if block ^-6 ^20 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load "easy/room3/1_the_wall:EMR3V1M2" ^-5 ^18 ^-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B3 easy matches 0 if score R3B3a easy matches 10 if block ^-6 ^20 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load "easy/room3/1_the_wall:EMR3V1M2a" ^-5 ^18 ^-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B3 easy matches 0 if score R3B3a easy matches 10.. if block ^-6 ^20 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players set R3B3 easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B3 easy matches 1 if score R3B3a easy matches 10.. if block ^-6 ^20 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players reset R3B3a easy
# // Exit Button
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B4 easy matches 0 if block ^-5 ^21 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="down"] run scoreboard players add R3B4a easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B4 easy matches 0 if score R3B4a easy matches 1 if block ^-5 ^21 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="down"] run fill ^7 ^19 ^4 ^4 ^19 ^5 air
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B4 easy matches 0 if score R3B4a easy matches 10 if block ^-5 ^21 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="down"] run fill ^7 ^20 ^4 ^4 ^20 ^5 air
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B4 easy matches 0 if score R3B4a easy matches 10 if block ^-5 ^21 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="down"] run tellraw @a[tag=easy] {"rawtext":[{"text": "§aTunnel Gate has been Opened!"}]}
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B4 easy matches 0 if score R3B4a easy matches 10.. if block ^-5 ^21 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="down"] run scoreboard players set R3B4 easy 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score R3B4 easy matches 1 if score R3B4a easy matches 10.. if block ^-5 ^21 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="down"] run scoreboard players reset R3B4a easy
# // - Flooding -
execute if score started3 easy matches 1 if score p_game easy matches 1.. if score r3_end easy matches 0 run scoreboard players add r3_timer_ms easy 1
execute if score r3_timer_ms easy matches 20.. run scoreboard players remove r3_timer_s easy 1
execute if score r3_timer_ms easy matches 20.. run scoreboard players set r3_timer_ms easy 0
execute if score r3_timer_s easy matches ..0 run scoreboard players add flood3 easy 1
# // flood part
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 1 if score r3_timer_s easy matches 3 if score r3_timer_ms easy matches 0 run playsound sfx.doors.opened @a[tag=easy] ~3.5 ~3 ~-8 1 0.7
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 1 if score r3_timer_s easy matches 3 if score r3_timer_ms easy matches 0 run structure load "easy:EasyTunnelDoor2" ~3 ~2 ~-8
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 1 if score r3_timer_s easy matches 3 if score r3_timer_ms easy matches 5 run structure load "easy:EasyTunnelDoor1" ~3 ~2 ~-8
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 1 if score r3_timer_s easy matches 3 if score r3_timer_ms easy matches 5 run structure load "easy:NuhUh" ~3 ~2 ~-13
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 1 if score r3_timer_s easy matches 0 run tellraw @a[tag=easy] {"rawtext":[{"text":"§3Water is rising!"}]}
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 1 if score r3_timer_s easy matches 0 run structure load "easy/room3/1_the_wall:EMR3V1F1" ~-6 ~2 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 2 if score r3_timer_s easy matches 0 run structure load "easy/room3/1_the_wall:EMR3V1F2" ~-6 ~3 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 3 if score r3_timer_s easy matches 0 run structure load "easy/room3/1_the_wall:EMR3V1F3" ~-6 ~4 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 4 if score r3_timer_s easy matches 0 run structure load "easy/room3/1_the_wall:EMR3V1F4" ~-6 ~5 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 5 if score r3_timer_s easy matches 0 run structure load "easy/room3/1_the_wall:EMR3V1F5" ~-6 ~6 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 6 if score r3_timer_s easy matches 0 run structure load "easy/room3/1_the_wall:EMR3V1F6" ~-6 ~7 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 7 if score r3_timer_s easy matches 0 run structure load "easy/room3/1_the_wall:EMR3V1F7" ~-6 ~8 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 8 if score r3_timer_s easy matches 0 run structure load "easy/room3/1_the_wall:EMR3V1F8" ~-6 ~9 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 9 if score r3_timer_s easy matches 0 run structure load "easy/room3/1_the_wall:EMR3V1F9" ~-6 ~10 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 10 if score r3_timer_s easy matches 0 run structure load "easy/room3/1_the_wall:EMR3V1F10" ~-6 ~11 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 11 if score r3_timer_s easy matches 0 run structure load "easy/room3/1_the_wall:EMR3V1F11" ~-6 ~12 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 12 if score r3_timer_s easy matches 0 run structure load "easy/room3/1_the_wall:EMR3V1F12" ~-6 ~13 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 13 if score r3_timer_s easy matches 0 run structure load "easy/room3/1_the_wall:EMR3V1F13" ~-6 ~14 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 14 if score r3_timer_s easy matches 0 run structure load "easy/room3/1_the_wall:EMR3V1F14" ~-6 ~15 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 15 if score r3_timer_s easy matches 0 run structure load "easy/room3/1_the_wall:EMR3V1F15" ~-6 ~16 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 16 if score r3_timer_s easy matches 0 run structure load "easy/room3/1_the_wall:EMR3V1F16" ~-6 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 17 if score r3_timer_s easy matches 0 run structure load "easy/room3/1_the_wall:EMR3V1F17" ~-6 ~18 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score flood3 easy matches 18 if score r3_timer_s easy matches 0 run structure load "easy/room3/1_the_wall:EMR3V1F18" ~-6 ~19 ~-6 0_degrees none block_by_block 1
# // flood end
execute if score r3_timer_s easy matches ..0 run scoreboard players set r3_timer_s easy 4
execute if score flood3 easy matches 18 if score r3_timer_ms easy matches 10 run scoreboard players set r3_end easy 1
# // exit tunnel
execute as @s[type=brr:flood_room, name=easy_room3] at @s run tag @a[tag=easy, x=~8, y=~19, z=~4, dx=6, dy=1, dz=1] add easytunnel3
execute as @s[type=brr:flood_room, name=easy_room3] at @s run tag @a[tag=easy, x=~7, y=~19, z=~4, dx=0, dy=1, dz=1] remove easytunnel3
# // exit player count
scoreboard players set p_tunnel3 easy 0
execute as @a[tag=easytunnel3] at @s run scoreboard players add p_tunnel3 easy 1
# // transition into room 3
execute if score p_tunnel3 easy = p_game easy if score started4 easy matches 0 run scoreboard players set r3_end easy 1
execute if score r3_end easy matches 1 run scoreboard players add r3_transition easy 1
execute if score r3_transition easy matches 1 as @s[type=brr:flood_room, name=easy_room3] at @s run playsound sfx.doors.opened @a[tag=easy] ~8 ~19.5 ~4.5 1 0.7
execute if score r3_transition easy matches 1 as @s[type=brr:flood_room, name=easy_room3] at @s run structure load "easy:EasyTunnelDoor2" ~8 ~19 ~4 270_degrees
execute if score r3_transition easy matches 10 as @s[type=brr:flood_room, name=easy_room3] at @s run structure load "easy:EasyTunnelDoor1" ~8 ~19 ~4 270_degrees
execute if score r3_transition easy matches 10 as @s[type=brr:flood_room, name=easy_room3] at @s positioned ~ ~2 ~ run fill ~-6 ~ ~-6 ~6 ~19 ~6 water
execute if score r3_transition easy matches 10 run scoreboard players set started4 easy 1
execute if score r3_transition easy matches 10.. run scoreboard players reset R3B1 easy
execute if score r3_transition easy matches 10.. run scoreboard players reset R3B2 easy
execute if score r3_transition easy matches 10.. run scoreboard players reset R3B3 easy
execute if score r3_transition easy matches 10.. run scoreboard players reset R3B4 easy
execute if score r3_transition easy matches 10.. run scoreboard players reset r3_timer_ms easy
execute if score r3_transition easy matches 10.. run scoreboard players reset r3_timer_s easy
execute if score r3_transition easy matches 10.. run scoreboard players reset r3_end easy
execute if score r3_transition easy matches 10.. run scoreboard players reset r3_transition easy