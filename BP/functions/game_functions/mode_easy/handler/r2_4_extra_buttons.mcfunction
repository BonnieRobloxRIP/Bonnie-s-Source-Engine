# = SYSTEM RUN =
# - Open entrance door -
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score started2 easy matches 1 if score r2_timer_s easy matches 21 if score r2_timer_ms easy matches 1 run structure load "easy:EasyTunnelDoor2" ~-4 ~2 ~-8
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score started2 easy matches 1 if score r2_timer_s easy matches 21 if score r2_timer_ms easy matches 10 run structure load "easy:EasyTunnelDoor3" ~-4 ~2 ~-8
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score started2 easy matches 1 if score r2_timer_s easy matches 21 if score r2_timer_ms easy matches 10 run playsound sfx.doors.tunnelopen @a[tag=easy] ~-3.5 ~3 ~-8
# - Level title -
execute as @a[tag=easy] at @s if score r2_timer_s easy matches 21 if score r2_timer_ms easy matches 10 if score started2 easy matches 1 run title @a[tag=easy] subtitle §2Extra Buttons
execute as @a[tag=easy] at @s if score r2_timer_s easy matches 21 if score r2_timer_ms easy matches 10 if score started2 easy matches 1 run title @a[tag=easy] title §aROOM 2
# - Test for buttons -
# // Button 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B1 easy matches 0 if block ^ ^7 ^1 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R2B1a easy 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B1 easy matches 0 if score R2B1a easy matches 1 if block ^ ^7 ^1 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1" ^2 ^1 ^3
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B1 easy matches 0 if score R2B1a easy matches 3 if block ^ ^7 ^1 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1" ^2 ^2 ^3
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B1 easy matches 0 if score R2B1a easy matches 5 if block ^ ^7 ^1 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1" ^2 ^3 ^3
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B1 easy matches 0 if score R2B1a easy matches 7 if block ^ ^7 ^1 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1" ^2 ^4 ^3
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B1 easy matches 0 if score R2B1a easy matches 9 if block ^ ^7 ^1 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1a" ^2 ^5 ^3
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B1 easy matches 0 if score R2B1a easy matches 9.. if block ^ ^7 ^1 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set R2B1 easy 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B1 easy matches 1 if score R2B1a easy matches 9.. if block ^ ^7 ^1 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players reset R2B1a easy
# // Button 2
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B2 easy matches 0 if block ^3 ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R2B2a easy 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B2 easy matches 0 if score R2B2a easy matches 1 if block ^3 ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1" ^-1 ^1 ^3
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B2 easy matches 0 if score R2B2a easy matches 3 if block ^3 ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1" ^-1 ^2 ^3
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B2 easy matches 0 if score R2B2a easy matches 5 if block ^3 ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1" ^-1 ^3 ^3
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B2 easy matches 0 if score R2B2a easy matches 7 if block ^3 ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1" ^-1 ^4 ^3
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B2 easy matches 0 if score R2B2a easy matches 9 if block ^3 ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1a" ^-1 ^5 ^3
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B2 easy matches 0 if score R2B2a easy matches 9.. if block ^3 ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set R2B2 easy 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B2 easy matches 1 if score R2B2a easy matches 9.. if block ^3 ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players reset R2B2a easy
# // Button 3
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B3 easy matches 0 if block ^ ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R2B3a easy 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B3 easy matches 0 if score R2B3a easy matches 1 if block ^ ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1" ^-4 ^1 ^
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B3 easy matches 0 if score R2B3a easy matches 3 if block ^ ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1" ^-4 ^2 ^
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B3 easy matches 0 if score R2B3a easy matches 5 if block ^ ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1" ^-4 ^3 ^
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B3 easy matches 0 if score R2B3a easy matches 7 if block ^ ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1" ^-4 ^4 ^
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B3 easy matches 0 if score R2B3a easy matches 9 if block ^ ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1a" ^-4 ^5 ^
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B3 easy matches 0 if score R2B3a easy matches 9.. if block ^ ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set R2B3 easy 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B3 easy matches 1 if score R2B3a easy matches 9.. if block ^ ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players reset R2B3a easy
# // Button 4
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B4 easy matches 0 if block ^-3 ^7 ^1 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R2B4a easy 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B4 easy matches 0 if score R2B4a easy matches 1 if block ^-3 ^7 ^1 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1" ^-4 ^1 ^3
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B4 easy matches 0 if score R2B4a easy matches 3 if block ^-3 ^7 ^1 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1" ^-4 ^2 ^3
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B4 easy matches 0 if score R2B4a easy matches 5 if block ^-3 ^7 ^1 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1" ^-4 ^3 ^3
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B4 easy matches 0 if score R2B4a easy matches 7 if block ^-3 ^7 ^1 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1" ^-4 ^4 ^3
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B4 easy matches 0 if score R2B4a easy matches 9 if block ^-3 ^7 ^1 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1a" ^-4 ^5 ^3
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B4 easy matches 0 if score R2B4a easy matches 9.. if block ^-3 ^7 ^1 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set R2B4 easy 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B4 easy matches 1 if score R2B4a easy matches 9.. if block ^-3 ^7 ^1 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players reset R2B4a easy
# // Button 5
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B5 easy matches 0 if block ^-3 ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R2B5a easy 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B5 easy matches 0 if score R2B5a easy matches 1 if block ^-3 ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1" ^2 ^1 ^
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B5 easy matches 0 if score R2B5a easy matches 3 if block ^-3 ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1" ^2 ^2 ^
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B5 easy matches 0 if score R2B5a easy matches 5 if block ^-3 ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1" ^2 ^3 ^
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B5 easy matches 0 if score R2B5a easy matches 7 if block ^-3 ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1" ^2 ^4 ^
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B5 easy matches 0 if score R2B5a easy matches 9 if block ^-3 ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M1a" ^2 ^5 ^
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B5 easy matches 0 if score R2B5a easy matches 9.. if block ^-3 ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set R2B5 easy 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B5 easy matches 1 if score R2B5a easy matches 9.. if block ^-3 ^7 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players reset R2B5a easy
# // Button 6
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B6 easy matches 0 if block ^3 ^7 ^1 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R2B6a easy 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B6 easy matches 0 if score R2B6a easy matches 1 if block ^3 ^7 ^1 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M2" ^6 ^7 ^-1 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B6 easy matches 0 if score R2B6a easy matches 10 if block ^3 ^7 ^1 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load "easy/room2/4_extra_buttons:EMR2V4M2a" ^5 ^7 ^-1 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B6 easy matches 0 if score R2B6a easy matches 10.. if block ^3 ^7 ^1 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set R2B6 easy 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B6 easy matches 1 if score R2B6a easy matches 10.. if block ^3 ^7 ^1 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players reset R2B6a easy
# // Exit Button
execute as @e[type=brr:flood_room, name=easy_room2] at @s if score R2B7 easy matches 0 if block ^6 ^19 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players add R2B7a easy 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B7 easy matches 0 if score R2B7a easy matches 1 if block ^6 ^19 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="west"] run fill ^-3 ^19 ^7 ^-4 ^19 ^7 air
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B7 easy matches 0 if score R2B7a easy matches 10 if block ^6 ^19 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="west"] run fill ^-3 ^20 ^7 ^-4 ^20 ^7 air
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B7 easy matches 0 if score R2B7a easy matches 10 if block ^6 ^19 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="west"] run tellraw @a[tag=easy] {"rawtext":[{"text": "§aTunnel Gate has been Opened!"}]}
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B7 easy matches 0 if score R2B7a easy matches 10.. if block ^6 ^19 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players set R2B7 easy 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B7 easy matches 1 if score R2B7a easy matches 10.. if block ^6 ^19 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players reset R2B7a easy
# // - Flooding -
execute if score started2 easy matches 1 if score p_game easy matches 1.. if score r2_end easy matches 0 run scoreboard players add r2_timer_ms easy 1
execute if score r2_timer_ms easy matches 20.. run scoreboard players remove r2_timer_s easy 1
execute if score r2_timer_ms easy matches 20.. run scoreboard players set r2_timer_ms easy 0
execute if score r2_timer_s easy matches ..0 run scoreboard players add flood2 easy 1
# // flood part
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 1 if score r2_timer_s easy matches 3 if score r2_timer_ms easy matches 0 run playsound sfx.doors.opened @a[tag=easy] ~-3.5 ~3 ~-8 1 0.7
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 1 if score r2_timer_s easy matches 3 if score r2_timer_ms easy matches 0 run structure load "easy:EasyTunnelDoor2" ~-4 ~2 ~-8
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 1 if score r2_timer_s easy matches 3 if score r2_timer_ms easy matches 5 run structure load "easy:EasyTunnelDoor1" ~-4 ~2 ~-8
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 1 if score r2_timer_s easy matches 3 if score r2_timer_ms easy matches 5 run structure load "easy:NuhUh" ~-4 ~2 ~-13
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 1 if score r2_timer_s easy matches 0 run tellraw @a[tag=easy] {"rawtext":[{"text":"§3Water is rising!"}]}
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 1 if score r2_timer_s easy matches 0 run structure load "easy/room2/4_extra_buttons:EMR2V4F1" ~-6 ~2 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 2 if score r2_timer_s easy matches 0 run structure load "easy/room2/4_extra_buttons:EMR2V4F2" ~-6 ~3 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 3 if score r2_timer_s easy matches 0 run structure load "easy/room2/4_extra_buttons:EMR2V4F3" ~-6 ~4 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 4 if score r2_timer_s easy matches 0 run structure load "easy/room2/4_extra_buttons:EMR2V4F4" ~-6 ~5 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 5 if score r2_timer_s easy matches 0 run structure load "easy/room2/4_extra_buttons:EMR2V4F5" ~-6 ~6 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 6 if score r2_timer_s easy matches 0 run structure load "easy/room2/4_extra_buttons:EMR2V4F6" ~-6 ~7 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 7 if score r2_timer_s easy matches 0 run structure load "easy/room2/4_extra_buttons:EMR2V4F7" ~-6 ~8 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 8 if score r2_timer_s easy matches 0 run structure load "easy/room2/4_extra_buttons:EMR2V4F8" ~-6 ~9 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 9 if score r2_timer_s easy matches 0 run structure load "easy/room2/4_extra_buttons:EMR2V4F9" ~-6 ~10 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 10 if score r2_timer_s easy matches 0 run structure load "easy/room2/4_extra_buttons:EMR2V4F10" ~-6 ~11 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 11 if score r2_timer_s easy matches 0 run structure load "easy/room2/4_extra_buttons:EMR2V4F11" ~-6 ~12 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 12 if score r2_timer_s easy matches 0 run structure load "easy/room2/4_extra_buttons:EMR2V4F12" ~-6 ~13 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 13 if score r2_timer_s easy matches 0 run structure load "easy/room2/4_extra_buttons:EMR2V4F13" ~-6 ~14 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 14 if score r2_timer_s easy matches 0 run structure load "easy/room2/4_extra_buttons:EMR2V4F14" ~-6 ~15 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 15 if score r2_timer_s easy matches 0 run structure load "easy/room2/4_extra_buttons:EMR2V4F15" ~-6 ~16 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 16 if score r2_timer_s easy matches 0 run structure load "easy/room2/4_extra_buttons:EMR2V4F16" ~-6 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 17 if score r2_timer_s easy matches 0 run structure load "easy/room2/4_extra_buttons:EMR2V4F17" ~-6 ~18 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 18 if score r2_timer_s easy matches 0 run structure load "easy/room2/4_extra_buttons:EMR2V4F18" ~-6 ~19 ~-6 0_degrees none block_by_block 1
# // flood end
execute if score r2_timer_s easy matches ..0 run scoreboard players set r2_timer_s easy 4
execute if score flood2 easy matches 18 if score r2_timer_ms easy matches 10 run scoreboard players set r2_end easy 1
# // exit tunnel
execute as @s[type=brr:flood_room, name=easy_room2] at @s run tag @a[tag=easy, x=~-4, y=~19, z=~8, dx=1, dy=1, dz=5] add easytunnel2
execute as @s[type=brr:flood_room, name=easy_room2] at @s run tag @a[tag=easy, x=~-4, y=~19, z=~7, dx=1, dy=1, dz=0] remove easytunnel2
# // exit player count
scoreboard players set p_tunnel2 easy 0
execute as @a[tag=easytunnel2] at @s run scoreboard players add p_tunnel2 easy 1
# // transition into room 3
execute if score p_tunnel2 easy = p_game easy if score started3 easy matches 0 run scoreboard players set r2_end easy 1
execute if score r2_end easy matches 1 run scoreboard players add r2_transition easy 1
execute if score r2_transition easy matches 1 as @s[type=brr:flood_room, name=easy_room2] at @s run playsound sfx.doors.opened @a[tag=easy] ~-4 ~19 ~8 1 0.7
execute if score r2_transition easy matches 1 as @s[type=brr:flood_room, name=easy_room2] at @s run structure load "easy:EasyTunnelDoor2" ~-4 ~19 ~8
execute if score r2_transition easy matches 10 as @s[type=brr:flood_room, name=easy_room2] at @s run structure load "easy:EasyTunnelDoor1" ~-4 ~19 ~8
execute if score r2_transition easy matches 10 as @s[type=brr:flood_room, name=easy_room2] at @s positioned ~ ~2 ~ run fill ~-6 ~ ~-6 ~6 ~19 ~6 water
execute if score r2_transition easy matches 10 run scoreboard players set started3 easy 1
execute if score r2_transition easy matches 10.. run scoreboard players reset R2B1 easy
execute if score r2_transition easy matches 10.. run scoreboard players reset R2B2 easy
execute if score r2_transition easy matches 10.. run scoreboard players reset R2B3 easy
execute if score r2_transition easy matches 10.. run scoreboard players reset R2B4 easy
execute if score r2_transition easy matches 10.. run scoreboard players reset R2B5 easy
execute if score r2_transition easy matches 10.. run scoreboard players reset R2B6 easy
execute if score r2_transition easy matches 10.. run scoreboard players reset R2B7 easy
execute if score r2_transition easy matches 10.. run scoreboard players reset r2_timer_ms easy
execute if score r2_transition easy matches 10.. run scoreboard players reset r2_timer_s easy
execute if score r2_transition easy matches 10.. run scoreboard players reset r2_end easy
execute if score r2_transition easy matches 10.. run scoreboard players reset r2_transition easy