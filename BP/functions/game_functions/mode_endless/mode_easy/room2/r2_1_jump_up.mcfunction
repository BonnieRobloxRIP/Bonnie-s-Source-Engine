# = SYSTEM RUN =
# - Open entrance door -
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 21 if score endless_timer_ms endless matches 1 run structure load mystructure:EasyTunnelDoor2  ~-3 ~4 ~-8
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 21 if score endless_timer_ms endless matches 10 run structure load mystructure:EasyTunnelDoor3 ~-3 ~4 ~-8
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 21 if score endless_timer_ms endless matches 10 run playsound sfx.doors.tunnelopen @a[tag=endless] ~-2.5 ~5 ~-8
# - Level title -
execute as @a[tag=endless] at @s if score endless_timer_s endless matches 21 if score endless_timer_ms endless matches 10 if score started endless matches 1 run title @a[tag=endless] subtitle §2Jump Up!
execute as @a[tag=endless] at @s if score endless_timer_s endless matches 21 if score endless_timer_ms endless matches 10 if score started endless matches 1 run titleraw @a[tag=endless] title {"rawtext":[{"text": "§aROOM "}, {"score":{"name": "room_count", "objective": "endless"}}]}
# - Test for buttons -
# // Button 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B1 endless matches 0 if block ^6 ^8 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load mystructure:EMR2V1M1 ^-4 ^4 ^-2 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B1 endless matches 0 if block ^6 ^8 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set R2B1 endless 1
# // Button 2
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B2 endless matches 0 if block ^-3 ^9 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R2B2a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B2 endless matches 0 if score R2B2a endless matches 1 if block ^-3 ^9 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load mystructure:EMR2V1M2a ^6 ^7 ^-2 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B2 endless matches 0 if score R2B2a endless matches 10 if block ^-3 ^9 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load mystructure:EMR2V1M2 ^5 ^7 ^-2 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B2 endless matches 0 if score R2B2a endless matches 10.. if block ^-3 ^9 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set R2B2 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B2 endless matches 1 if score R2B2a endless matches 10.. if block ^-3 ^9 ^3 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players reset R2B2a endless
# // Button 3
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B3 endless matches 0 if block ^-6 ^14 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players add R2B3a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B3 endless matches 0 if score R2B3a endless matches 1 if block ^-6 ^14 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load mystructure:EMR2V1M3b ^-2 ^12 ^4 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B3 endless matches 0 if score R2B3a endless matches 10 if block ^-6 ^14 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load mystructure:EMR2V1M3a ^-2 ^12 ^4 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B3 endless matches 0 if score R2B3a endless matches 20 if block ^-6 ^14 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load mystructure:EMR2V1M3 ^-2 ^12 ^4 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B3 endless matches 0 if score R2B3a endless matches 20.. if block ^-6 ^14 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players set R2B3 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B3 endless matches 1 if score R2B3a endless matches 20.. if block ^-6 ^14 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players reset R2B3a endless
# // Button 4
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B4 endless matches 0 if block ^-6 ^15 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R2B4a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B4 endless matches 0 if score R2B4a endless matches 1 if block ^-6 ^15 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load mystructure:EMR2V1M4a ^4 ^12 ^-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B4 endless matches 0 if score R2B4a endless matches 10 if block ^-6 ^15 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run structure load mystructure:EMR2V1M4 ^4 ^12 ^-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B4 endless matches 0 if score R2B4a endless matches 10.. if block ^-6 ^15 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players set R2B4 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B4 endless matches 1 if score R2B4a endless matches 10.. if block ^-6 ^15 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players reset R2B4a endless
# // Button 5
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B5 endless matches 0 if block ^-6 ^20 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="down"] run scoreboard players add R2B5a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B5 endless matches 0 if score R2B5a endless matches 1 if block ^-6 ^20 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="down"] run structure load mystructure:EMR2V1M5a ^6 ^18 ^-4 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B5 endless matches 0 if score R2B5a endless matches 10 if block ^-6 ^20 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="down"] run structure load mystructure:EMR2V1M5 ^5 ^18 ^-4 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B5 endless matches 0 if score R2B5a endless matches 10.. if block ^-6 ^20 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="down"] run scoreboard players set R2B5 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B5 endless matches 1 if score R2B5a endless matches 10.. if block ^-6 ^20 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="down"] run scoreboard players reset R2B5a endless
# // Exit Button
execute as @e[type=brr:flood_room, name=endless] at @s if score R2B6 endless matches 0 if block ^-6 ^19 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players add R2B6a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B6 endless matches 0 if score R2B6a endless matches 1 if block ^-6 ^19 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run fill ^3 ^19 ^7 ^4 ^19 ^7 air
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B6 endless matches 0 if score R2B6a endless matches 10 if block ^-6 ^19 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run fill ^3 ^20 ^7 ^4 ^20 ^7 air
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B6 endless matches 0 if score R2B6a endless matches 10 if block ^-6 ^19 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run tellraw @a[tag=endless] {"rawtext":[{"text": "§aTunnel Gate has been Opened!"}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B6 endless matches 0 if score R2B6a endless matches 10.. if block ^-6 ^19 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players set R2B6 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B6 endless matches 1 if score R2B6a endless matches 10.. if block ^-6 ^19 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players reset R2B6a endless
# // - Flooding -
execute if score started endless matches 1 if score p_game endless matches 1.. if score endless_end endless matches 0 run scoreboard players add endless_timer_ms endless 1
execute if score endless_timer_ms endless matches 20.. run scoreboard players remove endless_timer_s endless 1
execute if score endless_timer_ms endless matches 20.. run scoreboard players set endless_timer_ms endless 0
execute if score endless_timer_s endless matches ..0 run scoreboard players add flood endless 1
# // flood part
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 0 run tellraw @a[tag=endless] {"rawtext":[{"text":"§3Water is rising!"}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 0 run playsound sfx.glassbreaking @a[tag=endless]
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V1F1 ~-6 ~3 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 2 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V1F2 ~-6 ~4 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 3 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V1F3 ~-6 ~5 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 4 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V1F4 ~-6 ~6 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 5 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V1F5 ~-6 ~7 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 6 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V1F6 ~-6 ~8 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 7 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V1F7 ~-6 ~9 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 8 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V1F8 ~-6 ~10 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 9 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V1F9 ~-6 ~11 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 10 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V1F10 ~-6 ~12 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 11 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V1F11 ~-6 ~13 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 12 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V1F12 ~-6 ~14 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 13 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V1F13 ~-6 ~15 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 14 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V1F14 ~-6 ~16 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 15 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V1F15 ~-6 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 16 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V1F16 ~-6 ~18 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 17 if score endless_timer_s endless matches 0 run structure load mystructure:EMR2V1F17 ~-6 ~19 ~-6 0_degrees none block_by_block 1
# // flood end
execute if score endless_timer_s endless matches ..0 run scoreboard players set endless_timer_s endless 4
execute if score flood endless matches 17 if score endless_timer_ms endless matches 10 run scoreboard players set endless_end endless 1
# // exit tunnel
execute as @s[type=brr:flood_room, name=endless] at @s run tag @a[tag=endless, x=~3, y=~19, z=~8, dx=1, dy=1, dz=5] add endlesstunnel
execute as @s[type=brr:flood_room, name=endless] at @s run tag @a[tag=endless, x=~3, y=~19, z=~7, dx=1, dy=1, dz=0] remove endlesstunnel
# // exit player count
scoreboard players set p_tunnel endless 0
execute as @a[tag=endlesstunnel] at @s run scoreboard players add p_tunnel endless 1
# // transition into room 3
execute if score p_tunnel endless = p_game endless run scoreboard players set endless_end endless 1
execute if score endless_end endless matches 1 run scoreboard players add endless_transition endless 1
execute if score endless_transition endless matches 1 as @s[type=brr:flood_room, name=endless] at @s run playsound sfx.doors.opened @a[tag=endless] ~3 ~19 ~8 1 0.7
execute if score endless_transition endless matches 1 as @s[type=brr:flood_room, name=endless] at @s run structure load mystructure:EasyTunnelDoor2 ~3 ~19 ~8
execute if score endless_transition endless matches 10 as @s[type=brr:flood_room, name=endless] at @s run structure load mystructure:EasyTunnelDoor1 ~3 ~19 ~8
execute if score endless_transition endless matches 10 as @s[type=brr:flood_room, name=endless] at @s positioned ~ ~2 ~ run fill ~-6 ~ ~-6 ~6 ~19 ~6 water
execute if score endless_transition endless matches 31.. run function game_functions/mode_endless/reset_room