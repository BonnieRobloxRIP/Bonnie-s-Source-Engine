# = LOADING =
# // Level
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score loaded1 medium matches 0 run structure load "medium/room1/3_dusty_bridges:MediumRoom1V3" ~-7 ~1 ~-14
# // Next Room Anchor
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score loaded1 medium matches 0 run summon brr:flood_room ^3 ^18 ^-14 0 0 * medium_room1_anchor
# // - Scores -
# // buttons
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score loaded1 medium matches 0 run scoreboard players add R1B1 medium 0
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score loaded1 medium matches 0 run scoreboard players random R1B1P medium 1 7
# // essential
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score loaded1 medium matches 0 run scoreboard players add r1_end medium 0
execute as @e[type=brr:flood_room, name=medium_room1] at @s if score loaded1 medium matches 0 if score R1B1P medium matches 1 run setblock ^-1 ^2 ^2 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="up"]
execute as @e[type=brr:flood_room, name=medium_room1] at @s if score loaded1 medium matches 0 if score R1B1P medium matches 2 run setblock ^5 ^2 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="up"]
execute as @e[type=brr:flood_room, name=medium_room1] at @s if score loaded1 medium matches 0 if score R1B1P medium matches 3 run setblock ^5 ^2 ^-2 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="up"]
execute as @e[type=brr:flood_room, name=medium_room1] at @s if score loaded1 medium matches 0 if score R1B1P medium matches 4 run setblock ^-2 ^2 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="north"]
execute as @e[type=brr:flood_room, name=medium_room1] at @s if score loaded1 medium matches 0 if score R1B1P medium matches 5 run setblock ^-6 ^4 ^5 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="east"]
execute as @e[type=brr:flood_room, name=medium_room1] at @s if score loaded1 medium matches 0 if score R1B1P medium matches 5 run setblock ^-7 ^4 ^5 chiseled_stone_bricks
execute as @e[type=brr:flood_room, name=medium_room1] at @s if score loaded1 medium matches 0 if score R1B1P medium matches 6 run setblock ^6 ^4 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="west"]
execute as @e[type=brr:flood_room, name=medium_room1] at @s if score loaded1 medium matches 0 if score R1B1P medium matches 6 run setblock ^7 ^4 ^-5 chiseled_stone_bricks
execute as @e[type=brr:flood_room, name=medium_room1] at @s if score loaded1 medium matches 0 if score R1B1P medium matches 7 run setblock ^6 ^8 ^ brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="up"]
# // = End =
execute as @s[type=brr:flood_room, name=medium_room1] at @s if score loaded1 medium matches 0 run scoreboard players set loaded1 medium 1

# = LOADING ENDLESS =
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 1 run scoreboard players set loaded endless 0
# // Level
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "medium/room1:MediumRoom1" ~-7 ~1 ~-14
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "medium/room1/3_dusty_bridges:MediumRoom1V3" ~-7 ~1 ~-14
# // - Scores -
# // buttons
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R1B1 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players random R1B1P endless 1 7
# // essential
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add endless_end endless 0
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 if score R1B1P endless matches 1 run setblock ^-1 ^2 ^2 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="up"]
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 if score R1B1P endless matches 2 run setblock ^5 ^2 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="up"]
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 if score R1B1P endless matches 3 run setblock ^5 ^2 ^-2 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="up"]
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 if score R1B1P endless matches 4 run setblock ^-2 ^2 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="north"]
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 if score R1B1P endless matches 5 run setblock ^-6 ^4 ^5 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="east"]
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 if score R1B1P endless matches 5 run setblock ^-7 ^4 ^5 chiseled_stone_bricks
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 if score R1B1P endless matches 6 run setblock ^6 ^4 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="west"]
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 if score R1B1P endless matches 6 run setblock ^7 ^4 ^-5 chiseled_stone_bricks
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 if score R1B1P endless matches 7 run setblock ^6 ^8 ^ brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="up"]
# // tp player to start
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run tp @a[tag=endless] ^ ^2 ^
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run tag @a[tag=endless] remove endlesstunnel
# // = End =
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players set loaded endless 1