# = SYSTEM RUN =
# - Open entrance door -
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score started2 easy matches 1 if score r2_timer_s easy matches 21 if score r2_timer_ms easy matches 1 run structure load "easy:EasyTunnelDoor2" ~-3 ~2 ~-8
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score started2 easy matches 1 if score r2_timer_s easy matches 21 if score r2_timer_ms easy matches 10 run structure load "easy:EasyTunnelDoor3" ~-3 ~2 ~-8
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score started2 easy matches 1 if score r2_timer_s easy matches 21 if score r2_timer_ms easy matches 10 run playsound sfx.doors.tunnelopen @a[tag=easy] ~-2.5 ~3 ~-8
# - Level title -
execute as @a[tag=easy] at @s if score r2_timer_s easy matches 21 if score r2_timer_ms easy matches 10 if score started2 easy matches 1 run title @a[tag=easy] subtitle Â§2Mazed Warehouse
execute as @a[tag=easy] at @s if score r2_timer_s easy matches 21 if score r2_timer_ms easy matches 10 if score started2 easy matches 1 run title @a[tag=easy] title Â§aROOM 2
# - Test for buttons -
# // Exit Button
execute as @e[type=brr:flood_room, name=easy_room2] at @s if score R2B1 easy matches 0 if block ^-5 ^11 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players add R2B1a easy 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B1 easy matches 0 if score R2B1a easy matches 1 if block ^-5 ^11 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="south"] run fill ^3 ^19 ^7 ^4 ^19 ^7 air
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B1 easy matches 0 if score R2B1a easy matches 10 if block ^-5 ^11 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="south"] run fill ^3 ^20 ^7 ^4 ^20 ^7 air
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B1 easy matches 0 if score R2B1a easy matches 10 if block ^-5 ^11 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="south"] run tellraw @a[tag=easy] {"rawtext":[{"text": "Â§aTunnel Gate has been Opened!"}]}
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B1 easy matches 0 if score R2B1a easy matches 10.. if block ^-5 ^11 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players set R2B1 easy 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score R2B1 easy matches 1 if score R2B1a easy matches 10.. if block ^-5 ^11 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players reset R2B1a easy
# // - Flooding -
execute if score started2 easy matches 1 if score p_game easy matches 1.. if score r2_end easy matches 0 run scoreboard players add r2_timer_ms easy 1
execute if score r2_timer_ms easy matches 20.. run scoreboard players remove r2_timer_s easy 1
execute if score r2_timer_ms easy matches 20.. run scoreboard players set r2_timer_ms easy 0
execute if score r2_timer_s easy matches ..0 run scoreboard players add flood2 easy 1
# // flood part
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 1 if score r2_timer_s easy matches 3 if score r2_timer_ms easy matches 0 run playsound sfx.doors.opened @a[tag=easy] ~-2.5 ~3 ~-8 1 0.7
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 1 if score r2_timer_s easy matches 3 if score r2_timer_ms easy matches 0 run structure load "easy:EasyTunnelDoor2" ~-3 ~2 ~-8
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 1 if score r2_timer_s easy matches 3 if score r2_timer_ms easy matches 5 run structure load "easy:EasyTunnelDoor1" ~-3 ~2 ~-8
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 1 if score r2_timer_s easy matches 3 if score r2_timer_ms easy matches 5 run structure load "easy:NuhUh" ~-3 ~2 ~-13
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 1 if score r2_timer_s easy matches 0 run tellraw @a[tag=easy] {"rawtext":[{"text":"Â§3Water is rising!"}]}
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 1 if score r2_timer_s easy matches 0 run structure load "easy/room2/3_mazed_warehouse:EMR2V3F1" ~-6 ~2 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 2 if score r2_timer_s easy matches 0 run structure load "easy/room2/3_mazed_warehouse:EMR2V3F2" ~-6 ~3 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 3 if score r2_timer_s easy matches 0 run structure load "easy/room2/3_mazed_warehouse:EMR2V3F3" ~-6 ~4 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 4 if score r2_timer_s easy matches 0 run structure load "easy/room2/3_mazed_warehouse:EMR2V3F4" ~-6 ~5 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 5 if score r2_timer_s easy matches 0 run structure load "easy/room2/3_mazed_warehouse:EMR2V3F5" ~-6 ~6 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 6 if score r2_timer_s easy matches 0 run structure load "easy/room2/3_mazed_warehouse:EMR2V3F6" ~-6 ~7 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 7 if score r2_timer_s easy matches 0 run structure load "easy/room2/3_mazed_warehouse:EMR2V3F7" ~-6 ~8 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 8 if score r2_timer_s easy matches 0 run structure load "easy/room2/3_mazed_warehouse:EMR2V3F8" ~-6 ~9 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 9 if score r2_timer_s easy matches 0 run structure load "easy/room2/3_mazed_warehouse:EMR2V3F9" ~-6 ~10 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 10 if score r2_timer_s easy matches 0 run structure load "easy/room2/3_mazed_warehouse:EMR2V3F10" ~-6 ~11 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 11 if score r2_timer_s easy matches 0 run structure load "easy/room2/3_mazed_warehouse:EMR2V3F11" ~-6 ~12 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 12 if score r2_timer_s easy matches 0 run structure load "easy/room2/3_mazed_warehouse:EMR2V3F12" ~-6 ~13 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 13 if score r2_timer_s easy matches 0 run structure load "easy/room2/3_mazed_warehouse:EMR2V3F13" ~-6 ~14 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 14 if score r2_timer_s easy matches 0 run structure load "easy/room2/3_mazed_warehouse:EMR2V3F14" ~-6 ~15 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 15 if score r2_timer_s easy matches 0 run structure load "easy/room2/3_mazed_warehouse:EMR2V3F15" ~-6 ~16 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 16 if score r2_timer_s easy matches 0 run structure load "easy/room2/3_mazed_warehouse:EMR2V3F16" ~-6 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 17 if score r2_timer_s easy matches 0 run structure load "easy/room2/3_mazed_warehouse:EMR2V3F17" ~-6 ~18 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_room2] at @s if score flood2 easy matches 18 if score r2_timer_s easy matches 0 run structure load "easy/room2/3_mazed_warehouse:EMR2V3F18" ~-6 ~19 ~-6 0_degrees none block_by_block 1
# // flood end
execute if score r2_timer_s easy matches ..0 run scoreboard players set r2_timer_s easy 4
execute if score flood2 easy matches 18 if score r2_timer_ms easy matches 10 run scoreboard players set r2_end easy 1
# // exit tunnel
execute as @s[type=brr:flood_room, name=easy_room2] at @s run tag @a[tag=easy, x=~3, y=~19, z=~8, dx=1, dy=1, dz=5] add easytunnel2
execute as @s[type=brr:flood_room, name=easy_room2] at @s run tag @a[tag=easy, x=~3, y=~19, z=~7, dx=1, dy=1, dz=0] remove easytunnel2
# // exit player count
scoreboard players set p_tunnel2 easy 0
execute as @a[tag=easytunnel2] at @s run scoreboard players add p_tunnel2 easy 1
# // transition into room 3
execute if score p_tunnel2 easy = p_game easy if score started3 easy matches 0 run scoreboard players set r2_end easy 1
execute if score r2_end easy matches 1 run scoreboard players add r2_transition easy 1
execute if score r2_transition easy matches 1 as @s[type=brr:flood_room, name=easy_room2] at @s run playsound sfx.doors.opened @a[tag=easy] ~3 ~19 ~8 1 0.7
execute if score r2_transition easy matches 1 as @s[type=brr:flood_room, name=easy_room2] at @s run structure load "easy:EasyTunnelDoor2" ~3 ~19 ~8
execute if score r2_transition easy matches 10 as @s[type=brr:flood_room, name=easy_room2] at @s run structure load "easy:EasyTunnelDoor1" ~3 ~19 ~8
execute if score r2_transition easy matches 10 as @s[type=brr:flood_room, name=easy_room2] at @s positioned ~ ~2 ~ run fill ~-6 ~ ~-6 ~6 ~19 ~6 water
execute if score r2_transition easy matches 10 run scoreboard players set started3 easy 1
execute if score r2_transition easy matches 10.. run scoreboard players reset R2B1 easy
execute if score r2_transition easy matches 10.. run scoreboard players reset r2_timer_ms easy
execute if score r2_transition easy matches 10.. run scoreboard players reset r2_timer_s easy
execute if score r2_transition easy matches 10.. run scoreboard players reset r2_end easy
execute if score r2_transition easy matches 10.. run scoreboard players reset r2_transition easy