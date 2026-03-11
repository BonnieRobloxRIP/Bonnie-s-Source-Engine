# = TELEPORT =
tp @a[tag=i1, tag=!up1] 0 -48 19
tp @a[tag=i2, tag=!up1] -20 -48 22
tp @a[tag=i3, tag=!up1] -23 -48 2
tp @a[tag=i4, tag=!up1] -23 -48 -21
tp @a[tag=i5, tag=!up1] 0 -48 -21
tp @a[tag=i6, tag=!up1] 20 -48 -24
tp @a[tag=i7, tag=!up1] 23 -48 -4
tp @a[tag=i8, tag=!up1] 23 -48 19
tp @a[tag=i9, tag=!up1] 0 -48 42
tp @a[tag=i10, tag=!up1] -20 -48 45
tp @a[tag=i11, tag=!up1] -43 -48 45
tp @a[tag=i12, tag=!up1] -46 -48 22
tp @a[tag=i13, tag=!up1] -43 -48 2
tp @a[tag=i14, tag=!up1] -46 -48 -21
tp @a[tag=i15, tag=!up1] -46 -48 -44
tp @a[tag=i16, tag=!up1] -23 -48 -47
tp @a[tag=i17, tag=!up1] 0 -48 -44
tp @a[tag=i18, tag=!up1] 20 -48 -47
tp @a[tag=i19, tag=!up1] 43 -48 -47
tp @a[tag=i20, tag=!up1] 43 -48 -24
tp @a[tag=i21, tag=!up1] 46 -48 -4
tp @a[tag=i22, tag=!up1] 43 -48 19
tp @a[tag=i23, tag=!up1] 46 -48 42
tp @a[tag=i24, tag=!up1] 23 -48 45
# // special skin teleportation
tp @a[tag=i1, tag=up1] 0 -45 19
tp @a[tag=i2, tag=up1] -20 -45 22
tp @a[tag=i3, tag=up1] -23 -45 2
tp @a[tag=i4, tag=up1] -23 -45 -21
tp @a[tag=i5, tag=up1] 0 -45 -21
tp @a[tag=i6, tag=up1] 20 -45 -24
tp @a[tag=i7, tag=up1] 23 -45 -4
tp @a[tag=i8, tag=up1] 23 -45 19
tp @a[tag=i9, tag=up1] 0 -45 42
tp @a[tag=i10, tag=up1] -20 -45 45
tp @a[tag=i11, tag=up1] -43 -45 45
tp @a[tag=i12, tag=up1] -46 -45 22
tp @a[tag=i13, tag=up1] -43 -45 2
tp @a[tag=i14, tag=up1] -46 -45 -21
tp @a[tag=i15, tag=up1] -46 -45 -44
tp @a[tag=i16, tag=up1] -23 -45 -47
tp @a[tag=i17, tag=up1] 0 -45 -44
tp @a[tag=i18, tag=up1] 20 -45 -47
tp @a[tag=i19, tag=up1] 43 -45 -47
tp @a[tag=i20, tag=up1] 43 -45 -24
tp @a[tag=i21, tag=up1] 46 -45 -4
tp @a[tag=i22, tag=up1] 43 -45 19
tp @a[tag=i23, tag=up1] 46 -45 42
tp @a[tag=i24, tag=up1] 23 -45 45
# = LOAD CAGE SKINS =
execute as @a[tag=game, tag=purple_cageE] at @s run structure load mystructure:cage1 ~-1 ~-1 ~-1
execute as @a[tag=game, tag=fire_cageE] at @s run structure load mystructure:cage2 ~-1 ~-1 ~-1
execute as @a[tag=game, tag=dev_cageE] at @s run structure load mystructure:cage3 ~-1 ~-1 ~-1
execute as @a[tag=game, tag=nether_cageE] at @s run structure load mystructure:cage4 ~-2 ~-1 ~-2
execute as @a[tag=game, tag=fish_tank_cageE] at @s run structure load mystructure:cage5 ~-2 ~-1 ~-2
execute as @a[tag=game, tag=amethyst_cageE] at @s run structure load mystructure:cage6 ~-2 ~-1 ~-2
execute as @a[tag=game, tag=cherry_blossom_cageE] at @s run structure load mystructure:cage7 ~-2 ~-1 ~-2
execute as @a[tag=game, tag=mini_island_cageE] at @s run structure load mystructure:cage8 ~-2 ~-1 ~-2
execute as @a[tag=game, tag=ancient_city_cageE] at @s run structure load mystructure:cage9 ~-2 ~-1 ~-2
execute as @a[tag=game, tag=diamond_sword_cageE] at @s run structure load mystructure:cage10 ~-2 ~-1 ~-2
execute as @a[tag=game, tag=copper_airship_cageE] at @s run structure load mystructure:cage11 ~-2 ~-2 ~-2
execute as @a[tag=game, tag=bassalting_floater_cageE] at @s run structure load mystructure:cage12 ~-2 ~-2 ~-2
# = OTHER FUNCTIONS =
scoreboard players set game lobby 1
scoreboard players reset @a[tag=game] music
stopsound @a[tag=game] music.lobby.skywars