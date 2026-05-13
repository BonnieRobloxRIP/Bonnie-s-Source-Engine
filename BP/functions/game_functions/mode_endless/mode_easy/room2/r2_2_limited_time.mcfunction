# = SYSTEM RUN =
# - Open entrance door -
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 21 if score endless_timer_ms endless matches 1 run structure load mystructure:EasyTunnelDoor2 ~-4 ~2 ~-8
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 21 if score endless_timer_ms endless matches 10 run structure load mystructure:EasyTunnelDoor3 ~-4 ~2 ~-8
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 21 if score endless_timer_ms endless matches 10 run playsound sfx.doors.tunnelopen @a[tag=endless] ~-3.5 ~3 ~-8
# - Level title -
execute as @a[tag=endless] at @s if score endless_timer_s endless matches 21 if score endless_timer_ms endless matches 10 if score started endless matches 1 run title @a[tag=endless] subtitle §2Limited Time
execute as @a[tag=endless] at @s if score endless_timer_s endless matches 21 if score endless_timer_ms endless matches 10 if score started endless matches 1 run titleraw @a[tag=endless] title {"rawtext":[{"text": "§aROOM "}, {"score":{"name": "room_count", "objective": "endless"}}]}
# - Test for buttons -
# // Button 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B1 endless matches 0 if block ^-6 ^6 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players add R2B1a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B1 endless matches 0 if score R2B1a endless matches 1 if block ^-6 ^6 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load mystructure:EMR2V2M1 ^-2 ^1 ^-2
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B1 endless matches 0 if score R2B1a endless matches 5 if block ^-6 ^6 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run playsound silo_door.opened @a[tag=endless] ^ ^3 ^
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B1 endless matches 0 if score R2B1a endless matches 5 if block ^-6 ^6 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load mystructure:EMR2V2M1a ^-2 ^1 ^-2
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B1 endless matches 0 if score R2B1a endless matches 10 if block ^-6 ^6 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load mystructure:EMR2V2M1b ^-2 ^1 ^-2
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B1 endless matches 0 if score R2B1a endless matches 10.. if block ^-6 ^6 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players set R2B1 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B1 endless matches 1 if score R2B1a endless matches 10.. if block ^-6 ^6 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players reset R2B1a endless
# // Button 2
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B2 endless matches 0 if block ^-6 ^10 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players add R2B2a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B2 endless matches 0 if score R2B2a endless matches 1 if block ^-6 ^10 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run structure load mystructure:EMR2V2M2 ^-6 ^7 ^3 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B2 endless matches 0 if score R2B2a endless matches 6 if block ^-6 ^10 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run structure load mystructure:EMR2V2M2a ^-6 ^7 ^3 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B2 endless matches 0 if score R2B2a endless matches 6.. if block ^-6 ^10 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players set R2B2 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B2 endless matches 1 if score R2B2a endless matches 6.. if block ^-6 ^10 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players reset R2B2a endless
# // Button 3
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B3 endless matches 0 if block ^-6 ^10 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run scoreboard players add R2B3a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B3 endless matches 0 if score R2B3a endless matches 1 if block ^-6 ^10 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run playsound sfx.glassbreaking @a[tag=endless]
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B3 endless matches 0 if score R2B3a endless matches 1 if block ^-6 ^10 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run fill ^2 ^7 ^-1 ^2 ^9 ^1 air destroy
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B3 endless matches 0 if score R2B3a endless matches 1 if block ^-6 ^10 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run structure load mystructure:EMR2V2M3 ^6 ^7 ^0 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B3 endless matches 0 if score R2B3a endless matches 6 if block ^-6 ^10 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run structure load mystructure:EMR2V2M3a ^5 ^7 ^0 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B3 endless matches 0 if score R2B3a endless matches 6.. if block ^-6 ^10 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run scoreboard players set R2B3 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B3 endless matches 1 if score R2B3a endless matches 6.. if block ^-6 ^10 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run scoreboard players reset R2B3a endless
# // Button 4
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B4 endless matches 0 if block ^6 ^11 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run scoreboard players add R2B4a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B4 endless matches 0 if score R2B4a endless matches 1 if block ^6 ^11 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run structure load mystructure:EMR2V2M4 ^6 ^8 ^-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B4 endless matches 0 if score R2B4a endless matches 10 if block ^6 ^11 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run structure load mystructure:EMR2V2M4a ^5 ^8 ^-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B4 endless matches 0 if score R2B4a endless matches 10.. if block ^6 ^11 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run scoreboard players set R2B4 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B4 endless matches 1 if score R2B4a endless matches 10.. if block ^6 ^11 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run scoreboard players reset R2B4a endless
# // Exit Button
execute as @e[type=brr:flood_room, name=endless] at @s if score R2B5 endless matches 0 if block ^6 ^11 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players add R2B5a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B5 endless matches 0 if score R2B5a endless matches 1 if block ^6 ^11 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="south"] run structure load mystructure:EMR2V2M5 ^-1 ^7 ^-1 0_degrees none block_by_block 2
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B5 endless matches 0 if score R2B5a endless matches 1 if block ^6 ^11 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="south"] run fill ^-4 ^19 ^7 ^-5 ^19 ^7 air
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B5 endless matches 0 if score R2B5a endless matches 10 if block ^6 ^11 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="south"] run fill ^-4 ^20 ^7 ^-5 ^20 ^7 air
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B5 endless matches 0 if score R2B5a endless matches 10 if block ^6 ^11 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="south"] run tellraw @a[tag=endless] {"rawtext":[{"text": "§aTunnel Gate has been Opened!"}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B5 endless matches 0 if score R2B5a endless matches 10.. if block ^6 ^11 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players set R2B5 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B5 endless matches 1 if score R2B5a endless matches 10.. if block ^6 ^11 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players reset R2B5a endless
# // - Flooding -
execute if score started endless matches 1 if score p_game endless matches 1.. if score endless_end endless matches 0 run scoreboard players add endless_timer_ms endless 1
execute if score endless_timer_ms endless matches 20.. run scoreboard players remove endless_timer_s endless 1
execute if score endless_timer_ms endless matches 20.. run scoreboard players set endless_timer_ms endless 0
execute if score endless_timer_s endless matches ..0 run scoreboard players add flood endless 1
# // flood part
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 3 if score endless_timer_ms endless matches 0 run playsound sfx.doors.opened @a[tag=endless] ~-3.5 ~3 ~-8 1 0.7
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 3 if score endless_timer_ms endless matches 0 run structure load mystructure:EasyTunnelDoor2 ~-4 ~2 ~-8
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 3 if score endless_timer_ms endless matches 5 run structure load mystructure:EasyTunnelDoor1 ~-4 ~2 ~-8
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 3 if score endless_timer_ms endless matches 5 run structure load mystructure:NuhUh ~-4 ~2 ~-13
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 0 run tellraw @a[tag=endless] {"rawtext":[{"text":"§3Water is rising!"}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V2F1 ~-6 ~2 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 2 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V2F2 ~-6 ~3 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 3 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V2F3 ~-6 ~4 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 4 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V2F4 ~-6 ~5 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 5 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V2F5 ~-6 ~6 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 6 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V2F6 ~-6 ~7 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 7 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V2F7 ~-6 ~8 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 8 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V2F8 ~-6 ~9 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 9 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V2F9 ~-6 ~10 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 10 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V2F10 ~-6 ~11 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 11 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V2F11 ~-6 ~12 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 12 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V2F12 ~-6 ~13 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 13 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V2F13 ~-6 ~14 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 14 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V2F14 ~-6 ~15 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 15 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V2F15 ~-6 ~16 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 16 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V2F16 ~-6 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 17 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V2F17 ~-6 ~18 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 18 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V2F18 ~-6 ~19 ~-6 0_degrees none block_by_block 1
# // flood end
execute if score endless_timer_s endless matches ..0 run scoreboard players set endless_timer_s endless 4
execute if score flood endless matches 18 if score endless_timer_ms endless matches 10 run scoreboard players set endless_end endless 1
# // exit tunnel
execute as @s[type=brr:flood_room, name=endless] at @s run tag @a[tag=endless, x=~-5, y=~19, z=~8, dx=1, dy=1, dz=5] add endlesstunnel
execute as @s[type=brr:flood_room, name=endless] at @s run tag @a[tag=endless, x=~-5, y=~19, z=~7, dx=1, dy=1, dz=0] remove endlesstunnel
# // exit player count
scoreboard players set p_tunnel endless 0
execute as @a[tag=endlesstunnel] at @s run scoreboard players add p_tunnel endless 1
# // transition into room 3
execute if score p_tunnel endless = p_game endless run scoreboard players set endless_end endless 1
execute if score endless_end endless matches 1 run scoreboard players add endless_transition endless 1
execute if score endless_transition endless matches 1 as @s[type=brr:flood_room, name=endless] at @s run playsound sfx.doors.opened @a[tag=endless] ~-4.5 ~19 ~8 1 0.7
execute if score endless_transition endless matches 1 as @s[type=brr:flood_room, name=endless] at @s run structure load mystructure:EasyTunnelDoor2 ~-5 ~19 ~8
execute if score endless_transition endless matches 10 as @s[type=brr:flood_room, name=endless] at @s run structure load mystructure:EasyTunnelDoor1 ~-5 ~19 ~8
execute if score endless_transition endless matches 10 as @s[type=brr:flood_room, name=endless] at @s positioned ~ ~2 ~ run fill ~-6 ~ ~-6 ~6 ~19 ~6 water
execute if score endless_transition endless matches 31.. run function game_functions/mode_endless/reset_room