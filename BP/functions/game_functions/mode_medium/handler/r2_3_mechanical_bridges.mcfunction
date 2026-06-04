# = SYSTEM RUN =
# - Open entrance door -
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score started2 medium matches 1 if score r2_timer_s medium matches 16 if score r2_timer_ms medium matches 1 run structure load "medium:MediumTunnelDoor2" ~1 ~2 ~8
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score started2 medium matches 1 if score r2_timer_s medium matches 16 if score r2_timer_ms medium matches 10 run structure load "medium:MediumTunnelDoor3" ~1 ~2 ~8
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score started2 medium matches 1 if score r2_timer_s medium matches 16 if score r2_timer_ms medium matches 10 run playsound sfx.doors.tunnelopen @a[tag=medium] ~1.5 ~3 ~8
# - Level title -
execute as @a[tag=medium] at @s if score r2_timer_s medium matches 16 if score r2_timer_ms medium matches 10 if score started2 medium matches 1 run title @a[tag=medium] subtitle §6Mechanical Bridges
execute as @a[tag=medium] at @s if score r2_timer_s medium matches 16 if score r2_timer_ms medium matches 10 if score started2 medium matches 1 run title @a[tag=medium] title §eROOM 2
# - Test for buttons -
# // Button 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B1 medium matches 0 if block ^ ^9 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players add R2B1a medium 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B1 medium matches 0 if score R2B1a medium matches 1 run playsound sfx.moving_part2.start @a[tag=medium]
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B1 medium matches 0 if score R2B1a medium matches 1 run structure load "medium/room2/3_mechanical_bridges:MMR2V3M1" ^-6 ^8 ^-1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B1 medium matches 0 if score R2B1a medium matches 4 run structure load "medium/room2/3_mechanical_bridges:MMR2V3M1a" ^-6 ^8 ^-1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B1 medium matches 0 if score R2B1a medium matches 7 run structure load "medium/room2/3_mechanical_bridges:MMR2V3M1b" ^-6 ^8 ^-1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B1 medium matches 0 if score R2B1a medium matches 10 run structure load "medium/room2/3_mechanical_bridges:MMR2V3M1c" ^-6 ^8 ^-1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B1 medium matches 0 if score R2B1a medium matches 13 run structure load "medium/room2/3_mechanical_bridges:MMR2V3M1d" ^-6 ^8 ^-1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B1 medium matches 0 if score R2B1a medium matches 16 run structure load "medium/room2/3_mechanical_bridges:MMR2V3M1e" ^-6 ^8 ^-1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B1 medium matches 0 if score R2B1a medium matches 16 run stopsound @a[tag=medium] sfx.moving_part2.start
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B1 medium matches 0 if score R2B1a medium matches 16 run playsound sfx.moving_part2.stop @a[tag=medium]
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B1 medium matches 0 if score R2B1a medium matches 20 run structure load "medium/room2/3_mechanical_bridges:MMR2V3M1f" ^-6 ^9 ^-1 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B1 medium matches 0 if score R2B1a medium matches 25 run structure load "medium/room2/3_mechanical_bridges:MMR2V3M1g" ^-6 ^9 ^-1 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B1 medium matches 0 if score R2B1a medium matches 30 run structure load "medium/room2/3_mechanical_bridges:MMR2V3M1h" ^-6 ^9 ^-1 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B1 medium matches 0 if score R2B1a medium matches 30.. run scoreboard players set R2B1 medium 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B1 medium matches 1 if score R2B1a medium matches 30.. run scoreboard players reset R2B1a medium

# // Exit Button
execute as @e[type=brr:flood_room, name=medium_room2] at @s if score R2B2 medium matches 0 if block ^-6 ^16 ^-1 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players add R2B2a medium 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B2 medium matches 0 if score R2B2a medium matches 1  run fill ^-3 ^19 ^-7 ^-4 ^19 ^-7 air
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B2 medium matches 0 if score R2B2a medium matches 10  run fill ^-3 ^20 ^-7 ^-4 ^20 ^-7 air
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B2 medium matches 0 if score R2B2a medium matches 1 run playsound sfx.moving_part2.start @a[tag=medium]
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B2 medium matches 0 if score R2B2a medium matches 1 run structure load "medium/room2/3_mechanical_bridges:MMR2V3M1" ^-1 ^14 ^-6 90_degrees
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B2 medium matches 0 if score R2B2a medium matches 4 run structure load "medium/room2/3_mechanical_bridges:MMR2V3M1a" ^-1 ^14 ^-6 90_degrees
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B2 medium matches 0 if score R2B2a medium matches 7 run structure load "medium/room2/3_mechanical_bridges:MMR2V3M1b" ^-1 ^14 ^-6 90_degrees
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B2 medium matches 0 if score R2B2a medium matches 10 run structure load "medium/room2/3_mechanical_bridges:MMR2V3M1c" ^-1 ^14 ^-6 90_degrees
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B2 medium matches 0 if score R2B2a medium matches 13 run structure load "medium/room2/3_mechanical_bridges:MMR2V3M1d" ^-1 ^14 ^-6 90_degrees
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B2 medium matches 0 if score R2B2a medium matches 16 run structure load "medium/room2/3_mechanical_bridges:MMR2V3M1e" ^-1 ^14 ^-6 90_degrees
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B2 medium matches 0 if score R2B2a medium matches 16 run stopsound @a[tag=medium] sfx.moving_part2.start
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B2 medium matches 0 if score R2B2a medium matches 16 run playsound sfx.moving_part2.stop @a[tag=medium]
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B2 medium matches 0 if score R2B2a medium matches 20 run structure load "medium/room2/3_mechanical_bridges:MMR2V3M1f" ^-1 ^15 ^-6 90_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B2 medium matches 0 if score R2B2a medium matches 25 run structure load "medium/room2/3_mechanical_bridges:MMR2V3M1g" ^-1 ^15 ^-6 90_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B2 medium matches 0 if score R2B2a medium matches 30 run structure load "medium/room2/3_mechanical_bridges:MMR2V3M1h" ^-1 ^15 ^-6 90_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B2 medium matches 0 if score R2B2a medium matches 10  run tellraw @a[tag=medium] {"rawtext":[{"text": "§eTunnel Gate has been Opened!"}]}
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B2 medium matches 0 if score R2B2a medium matches 30..  run scoreboard players set R2B2 medium 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score R2B2 medium matches 1 if score R2B2a medium matches 30..  run scoreboard players reset R2B2a medium
# // - Flooding -
execute if score started2 medium matches 1 if score p_game medium matches 1.. if score r2_end medium matches 0 run scoreboard players add r2_timer_ms medium 1
execute if score r2_timer_ms medium matches 20.. run scoreboard players remove r2_timer_s medium 1
execute if score r2_timer_ms medium matches 20.. run scoreboard players set r2_timer_ms medium 0
execute if score r2_timer_s medium matches ..0 run scoreboard players add flood2 medium 1
# // flood part
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 1 if score r2_timer_s medium matches 3 if score r2_timer_ms medium matches 0 run playsound sfx.doors.opened @a[tag=medium] ~1.5 ~3 ~8 1 0.7
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 1 if score r2_timer_s medium matches 3 if score r2_timer_ms medium matches 0 run structure load "medium:MediumTunnelDoor2" ~1 ~2 ~8
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 1 if score r2_timer_s medium matches 3 if score r2_timer_ms medium matches 5 run structure load "medium:MediumTunnelDoor1" ~1 ~2 ~8
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 1 if score r2_timer_s medium matches 3 if score r2_timer_ms medium matches 5 run structure load "easy:NuhUh" ~1 ~2 ~9
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 1 if score r2_timer_s medium matches 0 run tellraw @a[tag=medium] {"rawtext":[{"text":"§3Water is rising!"}]}
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 1 if score r2_timer_s medium matches 0 run structure load "medium/room2/3_mechanical_bridges:MMR2V3F1" ~-6 ~2 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 2 if score r2_timer_s medium matches 0 run structure load "medium/room2/3_mechanical_bridges:MMR2V3F2" ~-6 ~3 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 3 if score r2_timer_s medium matches 0 run structure load "medium/room2/3_mechanical_bridges:MMR2V3F3" ~-6 ~4 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 4 if score r2_timer_s medium matches 0 run structure load "medium/room2/3_mechanical_bridges:MMR2V3F4" ~-6 ~5 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 5 if score r2_timer_s medium matches 0 run structure load "medium/room2/3_mechanical_bridges:MMR2V3F5" ~-6 ~6 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 6 if score r2_timer_s medium matches 0 run structure load "medium/room2/3_mechanical_bridges:MMR2V3F6" ~-6 ~7 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 7 if score r2_timer_s medium matches 0 run structure load "medium/room2/3_mechanical_bridges:MMR2V3F7" ~-6 ~8 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 8 if score r2_timer_s medium matches 0 run structure load "medium/room2/3_mechanical_bridges:MMR2V3F8" ~-6 ~9 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 9 if score r2_timer_s medium matches 0 run structure load "medium/room2/3_mechanical_bridges:MMR2V3F9" ~-6 ~10 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 10 if score r2_timer_s medium matches 0 run structure load "medium/room2/3_mechanical_bridges:MMR2V3F10" ~-6 ~11 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 11 if score r2_timer_s medium matches 0 run structure load "medium/room2/3_mechanical_bridges:MMR2V3F11" ~-6 ~12 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 12 if score r2_timer_s medium matches 0 run structure load "medium/room2/3_mechanical_bridges:MMR2V3F12" ~-6 ~13 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 13 if score r2_timer_s medium matches 0 run structure load "medium/room2/3_mechanical_bridges:MMR2V3F13" ~-6 ~14 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 14 if score r2_timer_s medium matches 0 run structure load "medium/room2/3_mechanical_bridges:MMR2V3F14" ~-6 ~15 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 15 if score r2_timer_s medium matches 0 run structure load "medium/room2/3_mechanical_bridges:MMR2V3F15" ~-6 ~16 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 16 if score r2_timer_s medium matches 0 run structure load "medium/room2/3_mechanical_bridges:MMR2V3F16" ~-6 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 17 if score r2_timer_s medium matches 0 run structure load "medium/room2/3_mechanical_bridges:MMR2V3F17" ~-6 ~18 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=medium_room2] at @s if score flood2 medium matches 18 if score r2_timer_s medium matches 0 run structure load "medium/room2/3_mechanical_bridges:MMR2V3F18" ~-6 ~19 ~-6 0_degrees none block_by_block 1
# // flood end
execute if score r2_timer_s medium matches ..0 run scoreboard players set r2_timer_s medium 4
execute if score flood2 medium matches 18 if score r2_timer_ms medium matches 10 run scoreboard players set r2_end medium 1
# // exit tunnel
execute as @s[type=brr:flood_room, name=medium_room2] at @s run tag @a[tag=medium, x=~-4, y=~19, z=~-14, dx=1, dy=1, dz=4] add mediumtunnel2
execute as @s[type=brr:flood_room, name=medium_room2] at @s run tag @a[tag=medium, x=~-4, y=~19, z=~-7, dx=1, dy=1, dz=0] remove mediumtunnel2
# // exit player count
scoreboard players set p_tunnel2 medium 0
execute as @a[tag=mediumtunnel2] at @s run scoreboard players add p_tunnel2 medium 1
# // transition into room 3
execute if score p_tunnel2 medium = p_game medium if score started3 medium matches 0 run scoreboard players set r2_end medium 1
execute if score r2_end medium matches 1 run scoreboard players add r2_transition medium 1
execute if score r2_transition medium matches 1 as @s[type=brr:flood_room, name=medium_room2] at @s run playsound sfx.doors.opened @a[tag=medium] ~-3.5 ~19 ~-8 1 0.7
execute if score r2_transition medium matches 1 as @s[type=brr:flood_room, name=medium_room2] at @s run structure load "medium:MediumTunnelDoor2" ~-4 ~19 ~-8
execute if score r2_transition medium matches 10 as @s[type=brr:flood_room, name=medium_room2] at @s run structure load "medium:MediumTunnelDoor1" ~-4 ~19 ~-8
execute if score r2_transition medium matches 10 as @s[type=brr:flood_room, name=medium_room2] at @s positioned ~ ~2 ~ run fill ~-6 ~ ~-6 ~6 ~19 ~6 water
execute if score r2_transition medium matches 10 run scoreboard players set started3 medium 1
execute if score r2_transition medium matches 10.. run scoreboard players reset R2B1 medium
execute if score r2_transition medium matches 10.. run scoreboard players reset R2B2 medium
execute if score r2_transition medium matches 10.. run scoreboard players reset r2_timer_ms medium
execute if score r2_transition medium matches 10.. run scoreboard players reset r2_timer_s medium
execute if score r2_transition medium matches 10.. run scoreboard players reset r2_end medium
execute if score r2_transition medium matches 10.. run scoreboard players reset r2_transition medium