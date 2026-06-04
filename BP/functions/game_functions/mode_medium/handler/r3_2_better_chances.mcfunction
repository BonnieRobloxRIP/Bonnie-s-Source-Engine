# = SYSTEM RUN =
# - Open entrance door -
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score started3 medium matches 1 if score r3_timer_s medium matches 16 if score r3_timer_ms medium matches 1 run structure load "medium:MediumTunnelDoor2" ~3 ~2 ~8
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score started3 medium matches 1 if score r3_timer_s medium matches 16 if score r3_timer_ms medium matches 10 run structure load "medium:MediumTunnelDoor3" ~3 ~2 ~8
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score started3 medium matches 1 if score r3_timer_s medium matches 16 if score r3_timer_ms medium matches 10 run playsound sfx.doors.tunnelopen @a[tag=medium] ~3.5 ~3 ~8
# - Level title -
execute as @a[tag=medium] at @s if score r3_timer_s medium matches 16 if score r3_timer_ms medium matches 10 if score started3 medium matches 1 run title @a[tag=medium] subtitle §6Better Chances
execute as @a[tag=medium] at @s if score r3_timer_s medium matches 16 if score r3_timer_ms medium matches 10 if score started3 medium matches 1 run title @a[tag=medium] title §eROOM 3
# - Test for buttons -
# // Position 1
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score R3B1 medium matches 0 if score R3B1P medium matches 1 if block ^2 ^4 ^-3 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players add R3B1a medium 1
# // Position 2
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score R3B1 medium matches 0 if score R3B1P medium matches 2 if block ^4 ^4 ^-3 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players add R3B1a medium 1
# // Position 3
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score R3B1 medium matches 0 if score R3B1P medium matches 3 if block ^-2 ^4 ^-4 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players add R3B1a medium 1
# // Position 4
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score R3B1 medium matches 0 if score R3B1P medium matches 4 if block ^-6 ^4 ^4 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players add R3B1a medium 1
# // Position 5
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score R3B1 medium matches 0 if score R3B1P medium matches 5 if block ^-1 ^8 ^-3 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players add R3B1a medium 1
# // Position 6
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score R3B1 medium matches 0 if score R3B1P medium matches 6 if block ^6 ^8 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players add R3B1a medium 1
# // Position 7
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score R3B1 medium matches 0 if score R3B1P medium matches 7 if block ^-3 ^12 ^-2 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="north"] run scoreboard players add R3B1a medium 1
# // Position 8
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score R3B1 medium matches 0 if score R3B1P medium matches 8 if block ^-1 ^12 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="north"] run scoreboard players add R3B1a medium 1
# // Position 9
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score R3B1 medium matches 0 if score R3B1P medium matches 9 if block ^6 ^16 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R3B1a medium 1
# // Position 10
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score R3B1 medium matches 0 if score R3B1P medium matches 10 if block ^-6 ^20 ^-1 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players add R3B1a medium 1
# // Exit Button
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score R3B1 medium matches 0 if score R3B1a medium matches 1 run fill ^-7 ^19 ^-4 ^-7 ^19 ^-5 air
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score R3B1 medium matches 0 if score R3B1a medium matches 10 run fill ^-7 ^20 ^-4 ^-7 ^20 ^-5 air
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score R3B1 medium matches 0 if score R3B1a medium matches 10 run tellraw @a[tag=medium] {"rawtext":[{"text": "§eTunnel Gate has been Opened!"}]}
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score R3B1 medium matches 0 if score R3B1a medium matches 10.. run scoreboard players set R3B1 medium 1
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score R3B1 medium matches 1 if score R3B1a medium matches 10.. run scoreboard players reset R3B1a medium
# // - Flooding -
execute if score started3 medium matches 1 if score p_game medium matches 1.. if score r3_end medium matches 0 run scoreboard players add r3_timer_ms medium 1
execute if score r3_timer_ms medium matches 20.. run scoreboard players remove r3_timer_s medium 1
execute if score r3_timer_ms medium matches 20.. run scoreboard players set r3_timer_ms medium 0
execute if score r3_timer_s medium matches ..0 run scoreboard players add flood3 medium 1
# // flood part
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 1 if score r3_timer_s medium matches 3 if score r3_timer_ms medium matches 0 run playsound sfx.doors.opened @a[tag=medium] ~3.5 ~3 ~8 1 0.7
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 1 if score r3_timer_s medium matches 3 if score r3_timer_ms medium matches 0 run structure load "medium:MediumTunnelDoor2" ~3 ~2 ~8
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 1 if score r3_timer_s medium matches 3 if score r3_timer_ms medium matches 5 run structure load "medium:MediumTunnelDoor1" ~3 ~2 ~8
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 1 if score r3_timer_s medium matches 3 if score r3_timer_ms medium matches 5 run structure load "easy:NuhUh" ~3 ~2 ~9
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 1 if score r3_timer_s medium matches 0 run tellraw @a[tag=medium] {"rawtext":[{"text":"§3Water is rising!"}]}
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 1 if score r3_timer_s medium matches 0 run structure load "medium/room3/2_better_chances:MMR3V2F1" ~-6 ~2 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 2 if score r3_timer_s medium matches 0 run structure load "medium/room3/2_better_chances:MMR3V2F2" ~-6 ~3 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 3 if score r3_timer_s medium matches 0 run structure load "medium/room3/2_better_chances:MMR3V2F3" ~-6 ~4 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 4 if score r3_timer_s medium matches 0 run structure load "medium/room3/2_better_chances:MMR3V2F4" ~-6 ~5 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 5 if score r3_timer_s medium matches 0 run structure load "medium/room3/2_better_chances:MMR3V2F5" ~-6 ~6 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 6 if score r3_timer_s medium matches 0 run structure load "medium/room3/2_better_chances:MMR3V2F6" ~-6 ~7 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 7 if score r3_timer_s medium matches 0 run structure load "medium/room3/2_better_chances:MMR3V2F7" ~-6 ~8 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 8 if score r3_timer_s medium matches 0 run structure load "medium/room3/2_better_chances:MMR3V2F8" ~-6 ~9 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 9 if score r3_timer_s medium matches 0 run structure load "medium/room3/2_better_chances:MMR3V2F9" ~-6 ~10 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 10 if score r3_timer_s medium matches 0 run structure load "medium/room3/2_better_chances:MMR3V2F10" ~-6 ~11 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 11 if score r3_timer_s medium matches 0 run structure load "medium/room3/2_better_chances:MMR3V2F11" ~-6 ~12 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 12 if score r3_timer_s medium matches 0 run structure load "medium/room3/2_better_chances:MMR3V2F12" ~-6 ~13 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 13 if score r3_timer_s medium matches 0 run structure load "medium/room3/2_better_chances:MMR3V2F13" ~-6 ~14 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 14 if score r3_timer_s medium matches 0 run structure load "medium/room3/2_better_chances:MMR3V2F14" ~-6 ~15 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 15 if score r3_timer_s medium matches 0 run structure load "medium/room3/2_better_chances:MMR3V2F15" ~-6 ~16 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 16 if score r3_timer_s medium matches 0 run structure load "medium/room3/2_better_chances:MMR3V2F16" ~-6 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 17 if score r3_timer_s medium matches 0 run structure load "medium/room3/2_better_chances:MMR3V2F17" ~-6 ~18 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room3] at @s if score flood3 medium matches 18 if score r3_timer_s medium matches 0 run structure load "medium/room3/2_better_chances:MMR3V2F18" ~-6 ~19 ~-6 0_degrees none block_by_block 1
# // flood end
execute if score r3_timer_s medium matches ..0 run scoreboard players set r3_timer_s medium 4
execute if score flood3 medium matches 18 if score r3_timer_ms medium matches 10 run scoreboard players set r3_end medium 1
# // exit tunnel
execute as @s[type=brr:flood_room, name=medium_room3] at @s run tag @a[tag=medium, x=~-15, y=~19, z=~-5, dx=5, dy=1, dz=1] add mediumtunnel3
execute as @s[type=brr:flood_room, name=medium_room3] at @s run tag @a[tag=medium, x=~-7, y=~19, z=~-5, dx=0, dy=1, dz=1] remove mediumtunnel3
# // exit player count
scoreboard players set p_tunnel3 medium 0
execute as @a[tag=mediumtunnel3] at @s run scoreboard players add p_tunnel3 medium 1
# // transition into room 3
execute if score p_tunnel3 medium = p_game medium if score started4 medium matches 0 run scoreboard players set r3_end medium 1
execute if score r3_end medium matches 1 run scoreboard players add r3_transition medium 1
execute if score r3_transition medium matches 1 as @s[type=brr:flood_room, name=medium_room3] at @s run playsound sfx.doors.opened @a[tag=medium] ~-8 ~19.5 ~-4.5 1 0.7
execute if score r3_transition medium matches 1 as @s[type=brr:flood_room, name=medium_room3] at @s run structure load "medium:MediumTunnelDoor2" ~-8 ~19 ~-5 270_degrees
execute if score r3_transition medium matches 10 as @s[type=brr:flood_room, name=medium_room3] at @s run structure load "medium:MediumTunnelDoor1" ~-8 ~19 ~-5 270_degrees
execute if score r3_transition medium matches 10 as @s[type=brr:flood_room, name=medium_room3] at @s positioned ~ ~2 ~ run fill ~-6 ~ ~-6 ~6 ~19 ~6 water
execute if score r3_transition medium matches 10 run scoreboard players set started4 medium 1
execute if score r3_transition medium matches 10.. run scoreboard players reset R3B1 medium
execute if score r3_transition medium matches 10.. run scoreboard players reset R3B1P medium
execute if score r3_transition medium matches 10.. run scoreboard players reset r3_timer_ms medium
execute if score r3_transition medium matches 10.. run scoreboard players reset r3_timer_s medium
execute if score r3_transition medium matches 10.. run scoreboard players reset r3_end medium
execute if score r3_transition medium matches 10.. run scoreboard players reset r3_transition medium