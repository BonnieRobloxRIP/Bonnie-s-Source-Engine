# = SYSTEM RUN =
# - Level title -
execute as @a[tag=medium] at @s if score r1_timer_s medium matches 16 if score r1_timer_ms medium matches 10 if score started medium matches 1 run title @a[tag=medium] subtitle §6Dusty Bridges
execute as @a[tag=medium] at @s if score r1_timer_s medium matches 16 if score r1_timer_ms medium matches 10 if score started medium matches 1 run title @a[tag=medium] title §eROOM 1
execute as @a[tag=medium] at @s run tag @s add medium_music
# - Test for buttons -
# // Position 1
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score R1B1 medium matches 0 if score R1B1P medium matches 1 if block ^-1 ^2 ^2 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R1B1a medium 1
# // Position 2
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score R1B1 medium matches 0 if score R1B1P medium matches 2 if block ^5 ^2 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R1B1a medium 1
# // Position 3
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score R1B1 medium matches 0 if score R1B1P medium matches 3 if block ^5 ^2 ^-2 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R1B1a medium 1
# // Position 4
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score R1B1 medium matches 0 if score R1B1P medium matches 4 if block ^-2 ^2 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="north"] run scoreboard players add R1B1a medium 1
# // Position 5
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score R1B1 medium matches 0 if score R1B1P medium matches 5 if block ^-6 ^4 ^5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players add R1B1a medium 1
# // Position 6
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score R1B1 medium matches 0 if score R1B1P medium matches 6 if block ^6 ^4 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players add R1B1a medium 1
# // Position 7
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score R1B1 medium matches 0 if score R1B1P medium matches 7 if block ^6 ^8 ^ brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R1B1a medium 1
# // Exit Button
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score R1B1 medium matches 0 if score R1B1a medium matches 1 run structure load "medium/room1/3_dusty_bridges:MMR1V3M1" ^-3 ^11 ^-2 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score R1B1 medium matches 0 if score R1B1a medium matches 1 run fill ^3 ^18 ^-7 ^4 ^18 ^-7 air
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score R1B1 medium matches 0 if score R1B1a medium matches 10 run fill ^3 ^19 ^-7 ^4 ^19 ^-7 air
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score R1B1 medium matches 0 if score R1B1a medium matches 10 run tellraw @a[tag=medium] {"rawtext":[{"text": "§eTunnel Gate has been Opened!"}]}
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score R1B1 medium matches 0 if score R1B1a medium matches 10.. run scoreboard players set R1B1 medium 1
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score R1B1 medium matches 1 if score R1B1a medium matches 10.. run scoreboard players reset R1B1a medium
# // - Flooding -
execute if score started medium matches 1 if score p_game medium matches 1.. if score r1_end medium matches 0 run scoreboard players add r1_timer_ms medium 1
execute if score r1_timer_ms medium matches 20.. run scoreboard players remove r1_timer_s medium 1
execute if score r1_timer_ms medium matches 20.. run scoreboard players set r1_timer_ms medium 0
execute if score r1_timer_s medium matches ..0 run scoreboard players add flood1 medium 1
# // flood part
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score flood1 medium matches 1 if score r1_timer_s medium matches 0 run tellraw @a[tag=medium] {"rawtext":[{"text":"§3Water is rising!"}]}
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score flood1 medium matches 1 if score r1_timer_s medium matches 0 run structure load "medium/room1/3_dusty_bridges:MMR1V3F1" ~-6 ~2 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score flood1 medium matches 2 if score r1_timer_s medium matches 0 run structure load "medium/room1/3_dusty_bridges:MMR1V3F2" ~-6 ~3 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score flood1 medium matches 3 if score r1_timer_s medium matches 0 run structure load "medium/room1/3_dusty_bridges:MMR1V3F3" ~-6 ~4 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score flood1 medium matches 4 if score r1_timer_s medium matches 0 run structure load "medium/room1/3_dusty_bridges:MMR1V3F4" ~-6 ~5 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score flood1 medium matches 5 if score r1_timer_s medium matches 0 run structure load "medium/room1/3_dusty_bridges:MMR1V3F5" ~-6 ~6 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score flood1 medium matches 6 if score r1_timer_s medium matches 0 run structure load "medium/room1/3_dusty_bridges:MMR1V3F6" ~-6 ~7 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score flood1 medium matches 7 if score r1_timer_s medium matches 0 run structure load "medium/room1/3_dusty_bridges:MMR1V3F7" ~-6 ~8 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score flood1 medium matches 8 if score r1_timer_s medium matches 0 run structure load "medium/room1/3_dusty_bridges:MMR1V3F8" ~-6 ~9 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score flood1 medium matches 9 if score r1_timer_s medium matches 0 run structure load "medium/room1/3_dusty_bridges:MMR1V3F9" ~-6 ~10 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score flood1 medium matches 10 if score r1_timer_s medium matches 0 run structure load "medium/room1/3_dusty_bridges:MMR1V3F10" ~-6 ~11 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score flood1 medium matches 11 if score r1_timer_s medium matches 0 run structure load "medium/room1/3_dusty_bridges:MMR1V3F11" ~-6 ~12 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score flood1 medium matches 12 if score r1_timer_s medium matches 0 run structure load "medium/room1/3_dusty_bridges:MMR1V3F12" ~-6 ~13 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score flood1 medium matches 13 if score r1_timer_s medium matches 0 run structure load "medium/room1/3_dusty_bridges:MMR1V3F13" ~-6 ~14 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score flood1 medium matches 14 if score r1_timer_s medium matches 0 run structure load "medium/room1/3_dusty_bridges:MMR1V3F14" ~-6 ~15 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score flood1 medium matches 15 if score r1_timer_s medium matches 0 run structure load "medium/room1/3_dusty_bridges:MMR1V3F15" ~-6 ~16 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score flood1 medium matches 16 if score r1_timer_s medium matches 0 run structure load "medium/room1/3_dusty_bridges:MMR1V3F16" ~-6 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score flood1 medium matches 17 if score r1_timer_s medium matches 0 run structure load "medium/room1/3_dusty_bridges:MMR1V3F17" ~-6 ~18 ~-6 0_degrees none block_by_block 1
# // flood end
execute if score r1_timer_s medium matches ..0 run scoreboard players set r1_timer_s medium 4
execute if score flood1 medium matches 17 if score r1_timer_ms medium matches 10 run scoreboard players set r1_end medium 1
# // exit tunnel
execute as @s[type=brr:flood_room, name=medium_room1] at @s run tag @a[tag=medium, x=~3, y=~18, z=~-14, dx=1, dy=1, dz=4] add mediumtunnel1
execute as @s[type=brr:flood_room, name=medium_room1] at @s run tag @a[tag=medium, x=~3, y=~18, z=~-7, dx=1, dy=1, dz=0] remove mediumtunnel1
# // exit player count
scoreboard players set p_tunnel1 medium 0
execute as @a[tag=mediumtunnel1] at @s run scoreboard players add p_tunnel1 medium 1
# // transition into room 2
execute if score p_tunnel1 medium = p_game medium if score started2 medium matches 0 run scoreboard players set r1_end medium 1
execute if score r1_end medium matches 1 unless score started2 medium matches 1 run scoreboard players add r1_transition medium 1
execute if score r1_transition medium matches 1 as @s[type=brr:flood_room, name=medium_room1] at @s run playsound sfx.doors.opened @a[tag=medium] ~3 ~18 ~-8 1 0.7
execute if score r1_transition medium matches 1 as @s[type=brr:flood_room, name=medium_room1] at @s run structure load "medium:MediumTunnelDoor2" ~3 ~18 ~-8
execute if score r1_transition medium matches 10 as @s[type=brr:flood_room, name=medium_room1] at @s run structure load "medium:MediumTunnelDoor1" ~3 ~18 ~-8
execute if score r1_transition medium matches 10 as @s[type=brr:flood_room, name=medium_room1] at @s positioned ~ ~2 ~ run fill ~-6 ~ ~-6 ~6 ~19 ~6 water
execute if score r1_transition medium matches 10 run scoreboard players set started2 medium 1
execute if score r1_transition medium matches 10.. run scoreboard players reset R1B1 medium
execute if score r1_transition medium matches 10.. run scoreboard players reset R1B1P medium
execute if score r1_transition medium matches 10.. run scoreboard players reset r1_timer_ms medium
execute if score r1_transition medium matches 10.. run scoreboard players reset r1_timer_s medium
execute if score r1_transition medium matches 10.. run scoreboard players reset r1_end medium
execute if score r1_transition medium matches 10.. run scoreboard players reset r1_transition medium