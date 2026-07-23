/**
 * Appendix C — Standard Element Schedule
 * Structures Inspection Manual (TMR)
 * Descriptions summarised from Appendix F — Detailed Element Description
 */

export type ElementGroup = 'abutment' | 'pier' | 'span' | 'approach'
export type QuantityUnit = 'm²' | 'm' | 'each' | 'm³'
export type MaterialCode = 'S' | 'P' | 'C' | 'T' | 'M' | 'O'
export type StructureFamily = 'girder' | 'box' | 'arch' | 'slab'

export type StandardElement = {
  no: number
  name: string
  significance: 1 | 2 | 3 | 4
  unit: QuantityUnit
  category: string
  groups: ElementGroup[]
}

export type ElementDescription = {
  title: string
  description: string
  material: MaterialCode
}

export const STANDARD_ELEMENTS: StandardElement[] = [
  { no: 1, name: "Wearing surface", significance: 2, unit: 'm²', category: "Carriageway level", groups: ['approach', 'span'] },
  { no: 2, name: "Barrier/railings", significance: 1, unit: 'm', category: "Carriageway level", groups: ['approach', 'span'] },
  { no: 3, name: "Kerbs", significance: 1, unit: 'm', category: "Carriageway level", groups: ['approach', 'span'] },
  { no: 4, name: "Footway", significance: 1, unit: 'm²', category: "Carriageway level", groups: ['approach', 'span'] },
  { no: 5, name: "Signage", significance: 1, unit: 'each', category: "Carriageway level", groups: ['approach', 'span'] },
  { no: 6, name: "Lighting", significance: 1, unit: 'each', category: "Carriageway level", groups: ['approach', 'span'] },
  { no: 100, name: "Open joint - butt", significance: 2, unit: 'm', category: "Deck joints", groups: ['abutment', 'pier', 'span'] },
  { no: 101, name: "Open joint - sliding plate", significance: 3, unit: 'm', category: "Deck joints", groups: ['abutment', 'pier', 'span'] },
  { no: 102, name: "Open joint - cantilever/finger", significance: 3, unit: 'm', category: "Deck joints", groups: ['abutment', 'pier', 'span'] },
  { no: 103, name: "Closed joint - filled butt", significance: 2, unit: 'm', category: "Deck joints", groups: ['abutment', 'pier', 'span'] },
  { no: 104, name: "Closed joint - asphaltic plug", significance: 2, unit: 'm', category: "Deck joints", groups: ['abutment', 'pier', 'span'] },
  { no: 105, name: "Closed joint - compression seal", significance: 2, unit: 'm', category: "Deck joints", groups: ['abutment', 'pier', 'span'] },
  { no: 106, name: "Closed joint - strip seal", significance: 2, unit: 'm', category: "Deck joints", groups: ['abutment', 'pier', 'span'] },
  { no: 107, name: "Closed joint - modular", significance: 2, unit: 'm', category: "Deck joints", groups: ['abutment', 'pier', 'span'] },
  { no: 108, name: "Closed joint - reinforced elastomer", significance: 2, unit: 'm', category: "Deck joints", groups: ['abutment', 'pier', 'span'] },
  { no: 200, name: "Deck", significance: 3, unit: 'm²', category: "Superstructure", groups: ['span'] },
  { no: 201, name: "Open beam", significance: 4, unit: 'm', category: "Superstructure", groups: ['span'] },
  { no: 202, name: "Closed web/box girder", significance: 4, unit: 'm', category: "Superstructure", groups: ['span'] },
  { no: 203, name: "Truss", significance: 4, unit: 'm', category: "Superstructure", groups: ['span'] },
  { no: 204, name: "Open spandrel arch", significance: 4, unit: 'm', category: "Superstructure", groups: ['span'] },
  { no: 205, name: "Closed spandrel arch", significance: 4, unit: 'm', category: "Superstructure", groups: ['span'] },
  { no: 206, name: "Spandrel column", significance: 4, unit: 'each', category: "Superstructure", groups: ['span'] },
  { no: 207, name: "Spandrel wall", significance: 3, unit: 'm', category: "Superstructure", groups: ['span'] },
  { no: 208, name: "Cable", significance: 4, unit: 'm', category: "Superstructure", groups: ['span'] },
  { no: 209, name: "Hanger", significance: 3, unit: 'each', category: "Superstructure", groups: ['span'] },
  { no: 210, name: "Half-joint", significance: 4, unit: 'each', category: "Superstructure", groups: ['span'] },
  { no: 211, name: "Transom", significance: 4, unit: 'each', category: "Superstructure", groups: ['span'] },
  { no: 212, name: "Stringer", significance: 4, unit: 'each', category: "Superstructure", groups: ['span'] },
  { no: 213, name: "Diaphragm/bracing", significance: 3, unit: 'each', category: "Superstructure", groups: ['span'] },
  { no: 214, name: "Load bearing diaphragm", significance: 4, unit: 'each', category: "Superstructure", groups: ['span'] },
  { no: 215, name: "Spiking Strip", significance: 2, unit: 'm', category: "Superstructure", groups: ['span'] },
  { no: 216, name: "External strengthening", significance: 4, unit: 'm', category: "Superstructure", groups: ['span'] },
  { no: 217, name: "Jacket system", significance: 4, unit: 'each', category: "Superstructure", groups: ['span'] },
  { no: 230, name: "Superstructure drainage", significance: 3, unit: 'each', category: "Superstructure", groups: ['approach', 'abutment', 'pier', 'span'] },
  { no: 300, name: "Fixed bearing", significance: 2, unit: 'each', category: "Bearings", groups: ['abutment', 'pier', 'span'] },
  { no: 301, name: "Movable", significance: 2, unit: 'each', category: "Bearings", groups: ['abutment', 'pier', 'span'] },
  { no: 302, name: "Elastomeric pad/strip bearing", significance: 2, unit: 'each', category: "Bearings", groups: ['abutment', 'pier', 'span'] },
  { no: 303, name: "Spherical bearing", significance: 2, unit: 'each', category: "Bearings", groups: ['abutment', 'pier', 'span'] },
  { no: 304, name: "Pot bearing", significance: 2, unit: 'each', category: "Bearings", groups: ['abutment', 'pier', 'span'] },
  { no: 305, name: "Enclosed bearing", significance: 1, unit: 'each', category: "Bearings", groups: ['abutment', 'pier', 'span'] },
  { no: 306, name: "Mortar pad /bearing pedestal", significance: 1, unit: 'each', category: "Bearings", groups: ['pier'] },
  { no: 307, name: "Restraint angle/thrust block", significance: 2, unit: 'each', category: "Bearings", groups: ['pier'] },
  { no: 308, name: "Seismic restraint", significance: 3, unit: 'each', category: "Bearings", groups: ['pier'] },
  { no: 309, name: "Corbel", significance: 3, unit: 'each', category: "Bearings", groups: ['pier'] },
  { no: 400, name: "Abutment", significance: 4, unit: 'm', category: "Substructure", groups: ['abutment'] },
  { no: 401, name: "Wingwall", significance: 3, unit: 'm', category: "Substructure", groups: ['abutment'] },
  { no: 402, name: "Pier cap", significance: 4, unit: 'm', category: "Substructure", groups: ['pier'] },
  { no: 403, name: "Pier wall", significance: 3, unit: 'm', category: "Substructure", groups: ['pier'] },
  { no: 404, name: "Column", significance: 4, unit: 'each', category: "Substructure", groups: ['abutment', 'pier'] },
  { no: 405, name: "Column (trestle)", significance: 4, unit: 'each', category: "Substructure", groups: ['abutment', 'pier'] },
  { no: 406, name: "Pile cap/Footing", significance: 3, unit: 'each', category: "Substructure", groups: ['abutment', 'pier'] },
  { no: 407, name: "Piles", significance: 4, unit: 'each', category: "Substructure", groups: ['abutment', 'pier'] },
  { no: 408, name: "Jacket system", significance: 4, unit: 'each', category: "Substructure", groups: ['abutment', 'pier'] },
  { no: 500, name: "Waterway", significance: 2, unit: 'each', category: "Miscellaneous", groups: ['approach', 'abutment', 'pier', 'span'] },
  { no: 501, name: "Batter/embankment", significance: 2, unit: 'each', category: "Miscellaneous", groups: ['approach', 'abutment'] },
  { no: 502, name: "Slope/scour Protection", significance: 2, unit: 'm²', category: "Miscellaneous", groups: ['approach', 'abutment', 'pier', 'span'] },
  { no: 503, name: "Feature crossed", significance: 1, unit: 'each', category: "Miscellaneous", groups: ['abutment', 'span'] },
  { no: 504, name: "Services", significance: 2, unit: 'each', category: "Miscellaneous", groups: ['approach', 'abutment', 'pier', 'span'] },
  { no: 505, name: "Open drainage", significance: 2, unit: 'each', category: "Miscellaneous", groups: ['approach', 'abutment', 'pier', 'span'] },
  { no: 600, name: "Box culvert", significance: 4, unit: 'm', category: "Culvert", groups: [] },
  { no: 601, name: "Pipe culvert", significance: 4, unit: 'm', category: "Culvert", groups: [] },
  { no: 602, name: "Pipe-arch culvert", significance: 4, unit: 'm', category: "Culvert", groups: [] },
  { no: 603, name: "Arch culvert", significance: 4, unit: 'm', category: "Culvert", groups: [] },
  { no: 604, name: "Invert protection", significance: 3, unit: 'm', category: "Culvert", groups: [] },
  { no: 605, name: "Wingwall", significance: 3, unit: 'm', category: "Culvert", groups: [] },
  { no: 606, name: "Headwall", significance: 2, unit: 'm', category: "Culvert", groups: [] },
  { no: 607, name: "Footing", significance: 3, unit: 'each', category: "Culvert", groups: [] },
  { no: 608, name: "Waterdrive", significance: 4, unit: 'm', category: "Culvert", groups: [] },
  { no: 609, name: "Abutment (Culvert)", significance: 4, unit: 'm', category: "Culvert", groups: [] },
  { no: 610, name: "Piles (Culvert)", significance: 4, unit: 'each', category: "Culvert", groups: [] },
  { no: 650, name: "Tunnel lining", significance: 4, unit: 'm', category: "Tunnel", groups: [] },
  { no: 651, name: "Tunnel ceiling panels/roofing", significance: 4, unit: 'm', category: "Tunnel", groups: [] },
  { no: 700, name: "Wall facing/panels", significance: 4, unit: 'm²', category: "Retaining wall/noise wall", groups: ['approach'] },
  { no: 701, name: "Pile/column", significance: 4, unit: 'each', category: "Retaining wall/noise wall", groups: ['approach'] },
  { no: 702, name: "Anchors", significance: 4, unit: 'each', category: "Retaining wall/noise wall", groups: ['approach'] },
  { no: 703, name: "Horizontal restraint", significance: 4, unit: 'each', category: "Retaining wall/noise wall", groups: ['approach'] },
  { no: 704, name: "Drainage system (Wall)", significance: 3, unit: 'each', category: "Retaining wall/noise wall", groups: ['approach'] },
  { no: 705, name: "Pile cap/Footing", significance: 3, unit: 'each', category: "Retaining wall/noise wall", groups: ['approach'] },
  { no: 800, name: "Base plates", significance: 4, unit: 'each', category: "Large traffic signs/gantries", groups: ['approach'] },
  { no: 801, name: "Columns", significance: 4, unit: 'each', category: "Large traffic signs/gantries", groups: ['approach'] },
  { no: 802, name: "Columns (trestle)", significance: 4, unit: 'each', category: "Large traffic signs/gantries", groups: ['approach'] },
  { no: 803, name: "Cantilever arms/Gantry beams", significance: 3, unit: 'each', category: "Large traffic signs/gantries", groups: ['approach'] },
  { no: 804, name: "Gantry truss", significance: 2, unit: 'each', category: "Large traffic signs/gantries", groups: ['approach'] },
  { no: 805, name: "Sign face support", significance: 2, unit: 'each', category: "Large traffic signs/gantries", groups: ['approach'] },
  { no: 806, name: "Footing", significance: 3, unit: 'each', category: "Large traffic signs/gantries", groups: ['approach'] },
  { no: 900, name: "Posts (incl. restraining cables)", significance: 4, unit: 'each', category: "Rockfall/slope debris control", groups: ['approach'] },
  { no: 901, name: "Mesh (incl. lateral cables)", significance: 4, unit: 'm²', category: "Rockfall/slope debris control", groups: ['approach'] },
  { no: 902, name: "Anchors", significance: 4, unit: 'each', category: "Rockfall/slope debris control", groups: ['approach'] },
  { no: 903, name: "Drainage system (Geo)", significance: 2, unit: 'each', category: "Rockfall/slope debris control", groups: ['approach'] },
  { no: 904, name: "Slope face", significance: 3, unit: 'm²', category: "Rockfall/slope debris control", groups: ['approach'] },
  { no: 905, name: "Slope covering", significance: 3, unit: 'm²', category: "Rockfall/slope debris control", groups: ['approach'] },
  { no: 906, name: "Erosion control", significance: 3, unit: 'm²', category: "Rockfall/slope debris control", groups: ['approach'] },
]

/** Primary Appendix F description per element number (preferred material variant). */
export const ELEMENT_DESCRIPTIONS: Record<number, ElementDescription> = {
  1: { title: "Wearing surface \u2013 Insitu concrete", description: "This applies to: \u2022 all bridge decks with an insitu concrete overlay intended as the running surface for traffic \u2022 approaches comprising concrete pavement. It excludes all bridge decks with no wearing surface, which shall be rated using element 200 (Deck).", material: 'C' },
  2: { title: "Barrier/railing \u2013 reinforced concrete", description: "This applies to all types and shape of barrier where the principal material is reinforced concrete. It also includes any insitu concrete stitch pours, concrete terminals, safety rails or barriers mounted on top of the barrier along with hold down fixings.", material: 'C' },
  3: { title: "Kerb \u2013 reinforced concrete", description: "This applies to any reinforced concrete kerb across a bridge deck (that is not associated with a footway element) which is not integral with the deck.", material: 'C' },
  4: { title: "Footway \u2013 reinforced concrete", description: "This applies to all footways constructed of reinforced concrete and includes any wearing surface. It does not include an exposed deck acting as a footway.", material: 'C' },
  5: { title: "Signage", description: "This element applies to structure specific signage only. I.e. BSN, Name, Posted Speed/Mass limits (where present), Single lane/priority give-way (where present). All normal signage is excluded.", material: 'O' },
  6: { title: "Lighting", description: "This element applies to lighting present on the structure that is provided for the safety of users (e.g. underpass lighting, street lighting)", material: 'O' },
  100: { title: "Open joint - butt", description: "This applies to all open expansion joints with or without steel nosings designed to allow moisture and debris to fall through the deck.", material: 'O' },
  101: { title: "Open joint \u2013 sliding plate", description: "This applies to all joints comprising a steel nosings with a fixed plate attached to one nosing sliding over the other.", material: 'O' },
  102: { title: "Open joint \u2013 cantilever/finger", description: "This applies to all joints comprising steel plate or teeth elements cantilevering from either side of the joint and interleaved. The cantilevered elements are typically affixed to underlying steel nosings embedded in concrete. A membrane, forming a drainage channel, is typically included beneath the cantilevering elements.", material: 'O' },
  103: { title: "Closed joint \u2013 filled butt", description: "This applies to all buried fixed/small movement joints comprising concrete elements cast/placed against each other with or without a separation/debonding layer.", material: 'O' },
  104: { title: "Closed joint \u2013 asphaltic plug", description: "This applies to those joints where the primary material forming the nosing and bridging the joint gap is an aggregate, bound with a binder of elastomeric material. This does not apply to joints that have been sealed over.", material: 'O' },
  105: { title: "Closed joint \u2013 compression seal", description: "This applies to those joints using a preformed compression type seal typically glued into place between steel or concrete nosings.", material: 'O' },
  106: { title: "Closed joint \u2013 strip seal", description: "This applies to those joints using an elastomeric membrane clamped either side of the joint by steel angle nosings or metal extrusions in concrete nosings.", material: 'O' },
  107: { title: "Closed joint \u2013 modular", description: "This applies to those joints comprising nosings on each side with multiple strip seals sandwiched between metal spacing members, resting on longitudinal rails.", material: 'O' },
  108: { title: "Closed joint \u2013 reinforced elastomer", description: "This applies to those joints comprising a reinforced elastomeric plank, or a thin elastomeric sheet anchored between two reinforced elastomeric block nosings.", material: 'O' },
  200: { title: "Deck \u2013 reinforced concrete", description: "This element encompasses insitu concrete decks, or precast reinforced concrete deck planks/slabs placed transversely over beams. It also includes contiguous reinforced concrete superstructure units forming both the span and deck such (i.e. slab decks)", material: 'C' },
  201: { title: "Open beam \u2013 reinforced concrete", description: "This element includes all reinforced concrete beams cast in situ, generally prior to 1950 though a few structures were built later using varying depth beams continuous over pier supports with a larger central span.", material: 'C' },
  202: { title: "Closed web/box girder \u2013 steel", description: "This element includes all closed web steel box girder bridges with concrete or steel deck closing the top of the box or boxes. The element does not include the deck which shall be covered under element 200.", material: 'S' },
  203: { title: "Truss \u2013 steel", description: "This element includes all steel truss elements, including all tension and compression members for deck, half-through and through trusses.", material: 'S' },
  204: { title: "Open spandrel arch \u2013 reinforced concrete", description: "This element includes reinforced concrete arch ribs of deck, tied or through arch bridges. It does not include closed spandrel arch structures which are covered under the Closed spandrel arch element.", material: 'C' },
  205: { title: "Closed spandrel arch \u2013 reinforced concrete", description: "This element includes concrete closed spandrel arch structures.", material: 'C' },
  206: { title: "Spandrel column \u2013 reinforced concrete", description: "This element comprises reinforced concrete spandrel columns transferring load from deck level down to the rib of an open spandrel arch.", material: 'C' },
  207: { title: "Spandrel wall \u2013 reinforced concrete", description: "This element includes all reinforced concrete spandrel walls. It does not include reinforced concrete barriers above road level which shall be captured under the barrier element.", material: 'C' },
  208: { title: "Cable \u2013 steel", description: "This element comprises all steel main suspension or cable stay cables not embedded in concrete. It includes saddle and steel anchorage components.", material: 'S' },
  209: { title: "Hanger \u2013 steel", description: "This element comprises all steel hangers.", material: 'S' },
  210: { title: "Half-joint \u2013 reinforced concrete", description: "This element includes any reinforced concrete in-span support between adjacent beams, whether intended as an in-span expansion joint or to support a suspended span. For the purposes of this element, the half-joint will include the bearing areas of each beam and the contributing adjacent length of beam (for these purposes considered the length of beam equivalent to depth of support).", material: 'C' },
  211: { title: "Transom \u2013 reinforced concrete", description: "This element includes all reinforced concrete transverse beams/members transferring load from the deck system to the main structural supports.", material: 'C' },
  212: { title: "Stringer \u2013 steel", description: "This element includes all steel stringers transferring load from the deck system into transom elements.", material: 'S' },
  213: { title: "Diaphragm/bracing \u2013 reinforced concrete", description: "This element includes cast-in-situ reinforced concrete end of deck stiffening and deep diaphragms between girders. In monolithic cast-in-situ flat slab bridges this element includes the deck thickening beam at the pier supports.", material: 'C' },
  214: { title: "Load bearing diaphragm \u2013 reinforced concrete", description: "This element defines those load bearing diaphragms constructed using reinforced concrete which are integral with the superstructure beams, visible to the inspector and are used to support the beams on the pier or columns below. Those load bearing diaphragms built-in to box girders or voided slab bridges and not visible should be considered as part of the superstructure and are not to be included in this element.", material: 'C' },
  215: { title: "Spiking strip \u2013 timber", description: "This item defines the spiking planks that are seated above main beams to which timber decking is attached.", material: 'T' },
  216: { title: "External strengthening \u2013 steel", description: "This element encompasses steel strengthening elements applied to an existing structures beams such as external post-tensioning systems or bonded steel strips. It does not include modification of steel beams through the addition of plate to web and flanges. These are included within the original steel beam.", material: 'S' },
  230: { title: "Superstructure drainage", description: "This element is intended to capture any drainage systems present on the structure including through deck scuppers discharging stormwater directly below the structure or self-contained systems conveying stormwater to a controlled discharge point.", material: 'O' },
  300: { title: "Fixed bearing \u2013 other", description: "This element defines those bearings that may provide for deflection or rotation only (no longitudinal movement) and includes steel plates bearing on concrete with or without locating pins or lugs, concrete bearing on malthoid, lead sheet or a bond breaking layer of colourless grease.", material: 'O' },
  301: { title: "Movable bearing \u2013 other", description: "This element defines those bearings that provide for both rotation and longitudinal movements by means of roller, rocker or sliding mechanisms.", material: 'O' },
  302: { title: "Elastomeric pad/strip bearing \u2013 other", description: "This element defines those bridge bearings constructed primarily of elastomers, with or without metal shims reinforcing the elastomer. The bearings may be free to move or have anti-sliding containment.", material: 'O' },
  303: { title: "Spherical bearing \u2013 other", description: "This element defines those bridge bearings comprising steel plates with convex and concave surfaces combined with a low friction sliding surface.", material: 'O' },
  304: { title: "Pot bearing \u2013 other", description: "This element defines high load bridge bearings comprising confined elastomers.", material: 'O' },
  305: { title: "Enclosed bearing \u2013 other", description: "This element defines those bearings that are enclosed so are not open for detailed inspection.", material: 'O' },
  306: { title: "Mortar pad/bearing pedestal \u2013 other", description: "This element defines those bearings consisting entirely of dry pack or wet boxed mortar, or high concrete pedestals greater than the nominal 50 mm thickness, unreinforced or reinforced with distribution steel. This section does not cover the packing mortar placed under a steel base plate. That mortar is covered under the relevant bearing on top of the base plate.", material: 'O' },
  307: { title: "Restraint angle/thrust blocks \u2013 Steel", description: "This element includes the restraint angles, holding down bolts and anchor blocks used to provide lateral restraint to beams/girders. It does not include hold down fixings/restraint incorporated into bearing systems which should be covered under the associated bearing element.", material: 'S' },
  308: { title: "Seismic restraint \u2013 Steel", description: "This element defines visible seismic linkages providing longitudinal restraint to prevent beams from dropping off supports. This element includes linkages as well as any cushioning elements.", material: 'S' },
  309: { title: "Corbel \u2013 steel", description: "This element defines steel corbels cantilevering beyond the face of the abutment/pier to provide additional grip/bearing for beams.", material: 'S' },
  400: { title: "Abutment \u2013 reinforced concrete", description: "This element defines all abutments constructed of reinforced concrete and includes short integral return walls which support the barrier end posts or terminals, ballast walls and side keeper walls. Wingwalls whether integral, attached or independent are considered separately under the wingwall element. Damage to seating areas beneath bearings is covered under the bearing element.", material: 'C' },
  401: { title: "Wingwall \u2013 reinforced concrete", description: "This element defines all wingwalls constructed of reinforced concrete.", material: 'C' },
  402: { title: "Pier cap \u2013 reinforced concrete", description: "This element includes all reinforced concrete pier caps that support the superstructure and transfer loads into piles/columns.", material: 'C' },
  403: { title: "Pier wall \u2013 reinforced concrete", description: "This element describes full height pier walls constructed using reinforced concrete and includes any thickening at the top of the wall to accommodate the superstructure. If, however, this thickening cantilevers out from the walls. Damage to bearing support areas beneath bearings is covered under the bearing items. Piers which have thin infill panels between columns shall be considered under this element (with the ...", material: 'C' },
  404: { title: "Column \u2013 reinforced concrete", description: "This element includes all reinforced concrete columns (or piles protruding above bed level) supporting a pier cap or the superstructure (directly). This element should encompass any ties, bracing or sheeting panels spanning between the columns which may be used to stiffen the columns or piles and/or to distribute loads.", material: 'C' },
  405: { title: "Column (trestle) \u2013 steel", description: "This element defines steel truss/built up towers and is intended to capture large supports and towers associated with large deck truss bridges.", material: 'S' },
  406: { title: "Pile cap/footing \u2013 reinforced concrete", description: "This element defines reinforced concrete pile caps/footings exposed for inspection either intentionally or because of scour.", material: 'C' },
  407: { title: "Pile \u2013 reinforced concrete", description: "This element includes all reinforced concrete piles (beneath a defined pile cap).", material: 'C' },
  408: { title: "Jacket system \u2013 reinforced concrete", description: "This element encompasses reinforced concrete jacketing systems used to encapsulate existing columns/piles.", material: 'C' },
  500: { title: "Waterway", description: "This element captures the waterway crossed and shall include all spans/cells above the channel, whether currently active or not.", material: 'O' },
  501: { title: "Batter/embankment", description: "This element captures batter slopes in front of bridge abutments.", material: 'O' },
  502: { title: "Feature crossed", description: "This element captures any feature crossed (other than waterway) including road/rail corridors, access tracks, foot/cycle paths or stock access.", material: 'O' },
  504: { title: "Services", description: "This element captures any service supported by the structure.", material: 'O' },
  505: { title: "Open drainage", description: "This element is intended to capture any drainage channels/systems discharging adjacent to/ near the structure (e.g. roadside drainage).", material: 'O' },
  601: { title: "Pipe \u2013 reinforced concrete", description: "This element includes all concrete pipe culvert/underpass. Wingwalls and headwalls whether integral, attached or independent are considered separately as are apron structures or any supplementary protection provided to the invert.", material: 'C' },
  602: { title: "Pipe-arch \u2013 steel", description: "This element includes all buried corrugated metal pipe-arch culvert/underpass. Wingwalls and headwalls whether integral, attached or independent are considered separately as are apron structures or any supplementary protection provided to the invert.", material: 'S' },
  603: { title: "Arch (culvert) \u2013 steel", description: "This element includes all buried corrugated metal arch structures spanning between foundations (I.e. no floor). Wingwalls and headwalls whether integral, attached or independent are considered separately as are apron structures or any supplementary protection provided to the invert.", material: 'S' },
  604: { title: "Invert protection \u2013 reinforced concrete", description: "This element includes all reinforced concrete invert protection systems installed through culverts. This includes inlet and outlet aprons along with any associated cut-off walls. Inlet, through barrel and outlet systems shall be treated separately.", material: 'C' },
  605: { title: "Wingwall \u2013 reinforced concrete", description: "This element defines all wingwalls constructed of reinforced concrete.", material: 'C' },
  606: { title: "Headwall \u2013 reinforced concrete", description: "This element includes all reinforced concrete headwalls above culvert barrels.", material: 'C' },
  607: { title: "Footing \u2013 reinforced concrete", description: "This element defines both mass and reinforced concrete culvert footings exposed for inspection either intentionally or because of scour.", material: 'C' },
  608: { title: "Waterdrive \u2013 other", description: "This element includes any unlined waterdrive.", material: 'O' },
  609: { title: "Abutment (culvert) \u2013 reinforced concrete", description: "This element defines all abutments constructed of reinforced concrete and includes short integral return walls which support the barrier end posts or terminals, ballast walls and side keeper walls. Wingwalls whether integral, attached or independent are considered separately under the wingwall element. Damage to seating areas beneath bearings is covered under the bearing element.", material: 'C' },
  610: { title: "Pile (culvert) \u2013 reinforced concrete", description: "This element includes all reinforced concrete piles (beneath a culvert abutment).", material: 'C' },
}

export const ELEMENT_DESCRIPTIONS_BY_MATERIAL: Record<number, Partial<Record<MaterialCode, Omit<ElementDescription, "material">>>> = {
  1: {
    C: { title: "Wearing surface \u2013 Insitu concrete", description: "This applies to: \u2022 all bridge decks with an insitu concrete overlay intended as the running surface for traffic \u2022 approaches comprising concrete pavement. It excludes all bridge decks with no wearing surface, which shall be rated using element 200 (Deck)." },
    T: { title: "Wearing surface \u2013 Timber", description: "This applies to: \u2022 timber running planks (longitudinal or diagonal) installed on a timber deck. It excludes the timber deck which shall be rated using element 20 (Deck)." },
    O: { title: "Wearing surface \u2013 other", description: "This applies to: \u2022 all bridge decks and approaches with gravel, chipseal or asphalt wearing surface." }
  },
  2: {
    S: { title: "Barrier/railing \u2013 steel", description: "This applies to all types and shapes of metal railings including tubes, railings w-section and Thriebeam barrier systems. Steel, aluminium, railings, rolled shapes will all be considered as part of this element. Also included in this item are the posts and end posts, irrespective of material type." },
    C: { title: "Barrier/railing \u2013 reinforced concrete", description: "This applies to all types and shape of barrier where the principal material is reinforced concrete. It also includes any insitu concrete stitch pours, concrete terminals, safety rails or barriers mounted on top of the barrier along with hold down fixings." },
    T: { title: "Barrier/railing \u2013 timber", description: "This applies to all types and shape of barrier where the principal material is timber." },
    M: { title: "Barrier/railing \u2013 masonry", description: "This applies to all types and shape of barrier where the principal material is masonry." }
  },
  3: {
    S: { title: "Kerb \u2013 steel", description: "This applies to any steel kerb across a bridge deck (that is not associated with a footway element) which is not integral with the deck." },
    C: { title: "Kerb \u2013 reinforced concrete", description: "This applies to any reinforced concrete kerb across a bridge deck (that is not associated with a footway element) which is not integral with the deck." },
    T: { title: "Kerbs \u2013 timber", description: "This applies to any timber kerb across a bridge deck (that is not associated with a footway element) which is not integral with the deck." }
  },
  4: {
    S: { title: "Footway \u2013 steel", description: "This applies to all footways constructed of steel plate and includes any protective coating or thin layer of surfacing material." },
    C: { title: "Footway \u2013 reinforced concrete", description: "This applies to all footways constructed of reinforced concrete and includes any wearing surface. It does not include an exposed deck acting as a footway." },
    T: { title: "Footway \u2013 timber", description: "This applies to all footways constructed of timber elements. It does not include an exposed deck acting as a footway." },
    O: { title: "Footway \u2013 other", description: "This applies to all footways constructed of all other materials including standard pavement construction or block paving." }
  },
  5: {
    O: { title: "Signage", description: "This element applies to structure specific signage only. I.e. BSN, Name, Posted Speed/Mass limits (where present), Single lane/priority give-way (where present). All normal signage is excluded." }
  },
  6: {
    O: { title: "Lighting", description: "This element applies to lighting present on the structure that is provided for the safety of users (e.g. underpass lighting, street lighting)" }
  },
  100: {
    O: { title: "Open joint - butt", description: "This applies to all open expansion joints with or without steel nosings designed to allow moisture and debris to fall through the deck." }
  },
  101: {
    O: { title: "Open joint \u2013 sliding plate", description: "This applies to all joints comprising a steel nosings with a fixed plate attached to one nosing sliding over the other." }
  },
  102: {
    O: { title: "Open joint \u2013 cantilever/finger", description: "This applies to all joints comprising steel plate or teeth elements cantilevering from either side of the joint and interleaved. The cantilevered elements are typically affixed to underlying steel nosings embedded in concrete. A membrane, forming a drainage channel, is typically included beneath the cantilevering elements." }
  },
  103: {
    O: { title: "Closed joint \u2013 filled butt", description: "This applies to all buried fixed/small movement joints comprising concrete elements cast/placed against each other with or without a separation/debonding layer." }
  },
  104: {
    O: { title: "Closed joint \u2013 asphaltic plug", description: "This applies to those joints where the primary material forming the nosing and bridging the joint gap is an aggregate, bound with a binder of elastomeric material. This does not apply to joints that have been sealed over." }
  },
  105: {
    O: { title: "Closed joint \u2013 compression seal", description: "This applies to those joints using a preformed compression type seal typically glued into place between steel or concrete nosings." }
  },
  106: {
    O: { title: "Closed joint \u2013 strip seal", description: "This applies to those joints using an elastomeric membrane clamped either side of the joint by steel angle nosings or metal extrusions in concrete nosings." }
  },
  107: {
    O: { title: "Closed joint \u2013 modular", description: "This applies to those joints comprising nosings on each side with multiple strip seals sandwiched between metal spacing members, resting on longitudinal rails." }
  },
  108: {
    O: { title: "Closed joint \u2013 reinforced elastomer", description: "This applies to those joints comprising a reinforced elastomeric plank, or a thin elastomeric sheet anchored between two reinforced elastomeric block nosings." }
  },
  200: {
    S: { title: "Deck \u2013 steel", description: "This element encompasses those bridge decks comprising open grid steel, corrugated/trapezoidal steel (with infill) or orthotropic steel decks. It does not include temporary or permanent formwork with no structural contribution to the deck system." },
    P: { title: "Deck \u2013 prestressed concrete", description: "This element encompasses all prestressed concrete deck planks/slabs placed transversely over beams. It also includes contiguous prestressed concrete superstructure units forming both the span and deck such as log-beams and hollow core deck units. Composite insitu concrete slabs (where present) shall be considered within this element." },
    C: { title: "Deck \u2013 reinforced concrete", description: "This element encompasses insitu concrete decks, or precast reinforced concrete deck planks/slabs placed transversely over beams. It also includes contiguous reinforced concrete superstructure units forming both the span and deck such (i.e. slab decks)" },
    T: { title: "Deck \u2013 timber", description: "This element includes all types of timber deck including laminated timber decks and glued laminated timber sheet (plywood) decks." },
    O: { title: "Deck \u2013 other", description: "This element includes all other types of deck constructed using materials not described above." }
  },
  201: {
    S: { title: "Open beam \u2013 steel", description: "This element includes all girders constructed of wrought iron or steel irrespective of protective coating. The girders may be rolled sections, welded plate girders, riveted girders constructed of plates and angles, or lattice girders using flat sections crossing each other to form the vertical web/webs." },
    P: { title: "Open beam \u2013 prestressed concrete", description: "This element includes a variety of girders developed over the years using prestressed concrete. The vast majority are pretensioned, prestressed concrete members however post tensioned girders, including some segmental constructions, have also been adopted." },
    C: { title: "Open beam \u2013 reinforced concrete", description: "This element includes all reinforced concrete beams cast in situ, generally prior to 1950 though a few structures were built later using varying depth beams continuous over pier supports with a larger central span." },
    T: { title: "Open beam \u2013 timber", description: "This element includes all hardwood and softwood timber beams, including engineered timber sections." },
    O: { title: "Open beam \u2013 other", description: "This element includes all other types of beams constructed using materials not described above." }
  },
  202: {
    S: { title: "Closed web/box girder \u2013 steel", description: "This element includes all closed web steel box girder bridges with concrete or steel deck closing the top of the box or boxes. The element does not include the deck which shall be covered under element 200." },
    P: { title: "Closed web/box girder \u2013 prestressed concrete", description: "This element includes all closed web or box girder bridges constructed of prestressed concrete and includes segmental post tensioned box girders and precast prestressed \"U\" beams with a cast- in-situ deck to form the closed box shape. This element does not include the deck where cast insitu later." }
  },
  203: {
    S: { title: "Truss \u2013 steel", description: "This element includes all steel truss elements, including all tension and compression members for deck, half-through and through trusses." },
    T: { title: "Truss \u2013 timber", description: "This element includes all timber truss elements, including all tension and compression members for deck, half-through and through trusses. It also includes steel tension members (vertical and bottom truss elements) in steel/timber hybrids." }
  },
  204: {
    S: { title: "Open spandrel arch \u2013 steel", description: "This element includes the arch rib in open spandrel steel arch bridges. It does not include buried corrugated metal arch structures which are covered under the equivalent closed spandrel arch or arch (culvert) element." },
    C: { title: "Open spandrel arch \u2013 reinforced concrete", description: "This element includes reinforced concrete arch ribs of deck, tied or through arch bridges. It does not include closed spandrel arch structures which are covered under the Closed spandrel arch element." }
  },
  205: {
    S: { title: "Closed spandrel arch \u2013 steel", description: "This element includes the barrel of corrugated metal arch spans (where the structure is classed as a bridge). It does not include buried corrugated metal arch structures classed as culverts, which are covered under the arch (culvert) element." },
    C: { title: "Closed spandrel arch \u2013 reinforced concrete", description: "This element includes concrete closed spandrel arch structures." },
    M: { title: "Closed spandrel arch \u2013 masonry", description: "This element includes all masonry/stone arches." }
  },
  206: {
    S: { title: "Spandrel column \u2013 steel", description: "This element comprises steel spandrel columns transferring load from deck level down to the rib of an open spandrel arch." },
    C: { title: "Spandrel column \u2013 reinforced concrete", description: "This element comprises reinforced concrete spandrel columns transferring load from deck level down to the rib of an open spandrel arch." }
  },
  207: {
    C: { title: "Spandrel wall \u2013 reinforced concrete", description: "This element includes all reinforced concrete spandrel walls. It does not include reinforced concrete barriers above road level which shall be captured under the barrier element." },
    M: { title: "Spandrel wall \u2013 masonry", description: "This element includes all masonry spandrel walls. It does not include reinforced concrete barriers above road level which shall be captured under the barrier element." }
  },
  208: {
    S: { title: "Cable \u2013 steel", description: "This element comprises all steel main suspension or cable stay cables not embedded in concrete. It includes saddle and steel anchorage components." }
  },
  209: {
    S: { title: "Hanger \u2013 steel", description: "This element comprises all steel hangers." }
  },
  210: {
    S: { title: "Half-joint \u2013 steel", description: "This element includes any steel in-span support between adjacent beams, whether intended as an in-span expansion joint or to support a suspended span. For the purposes of this element, the half-joint will include the bearing areas of each beam and the contributing adjacent length of beam (for these purposes considered the length of beam equivalent to depth of support)." },
    C: { title: "Half-joint \u2013 reinforced concrete", description: "This element includes any reinforced concrete in-span support between adjacent beams, whether intended as an in-span expansion joint or to support a suspended span. For the purposes of this element, the half-joint will include the bearing areas of each beam and the contributing adjacent length of beam (for these purposes considered the length of beam equivalent to depth of support)." }
  },
  211: {
    S: { title: "Transom \u2013 steel", description: "This element includes all steel transverse beams/members transferring load from the deck system to the main structural supports." },
    P: { title: "Transom \u2013 prestressed concrete", description: "This element includes all prestressed concrete transverse beams/members transferring load from the deck system to the main structural supports." },
    C: { title: "Transom \u2013 reinforced concrete", description: "This element includes all reinforced concrete transverse beams/members transferring load from the deck system to the main structural supports." },
    T: { title: "Transom \u2013 timber", description: "This element includes all timber transverse beams/members transferring load from the deck system to the main structural supports." }
  },
  212: {
    S: { title: "Stringer \u2013 steel", description: "This element includes all steel stringers transferring load from the deck system into transom elements." },
    T: { title: "Stringer \u2013 timber", description: "This element includes all timber stringers transferring load from the deck system into transom elements." }
  },
  213: {
    S: { title: "Diaphragm/bracing \u2013 steel", description: "This element includes all stiffening devices for the ends of the deck and between steel girders and includes wind bracing of large girder bridges. The diaphragms may have stud connectors into the deck to support and stiffen the ends of the deck. Bracing may be simple steel rods, straps or small angles crossing between the girders, or be heavy channel connectors between the beam webs. Wind bracing may be by steel a..." },
    C: { title: "Diaphragm/bracing \u2013 reinforced concrete", description: "This element includes cast-in-situ reinforced concrete end of deck stiffening and deep diaphragms between girders. In monolithic cast-in-situ flat slab bridges this element includes the deck thickening beam at the pier supports." },
    T: { title: "Diaphragm/bracing \u2013 timber", description: "This element includes all timber diaphragms/bracing between girders." }
  },
  214: {
    S: { title: "Load bearing diaphragm \u2013 steel", description: "This element defines those load bearing diaphragms constructed using steel which are integral with the superstructure beams, visible to the inspector and are used to support the beams on the pier or columns below. Those load bearing diaphragms built-in to box girders or voided slab bridges and not visible should be considered as part of the superstructure and are not to be included in this element." },
    P: { title: "Load bearing diaphragm \u2013 prestressed concrete", description: "This element defines those load bearing diaphragms constructed using prestressed concrete which are integral with the superstructure beams, visible to the inspector and are used to support the beams on the pier or columns below. Those load bearing diaphragms built-in to box girders or voided slab bridges and not visible should be considered as part of the superstructure and are not to be included in this element." },
    C: { title: "Load bearing diaphragm \u2013 reinforced concrete", description: "This element defines those load bearing diaphragms constructed using reinforced concrete which are integral with the superstructure beams, visible to the inspector and are used to support the beams on the pier or columns below. Those load bearing diaphragms built-in to box girders or voided slab bridges and not visible should be considered as part of the superstructure and are not to be included in this element." }
  },
  215: {
    T: { title: "Spiking strip \u2013 timber", description: "This item defines the spiking planks that are seated above main beams to which timber decking is attached." }
  },
  216: {
    S: { title: "External strengthening \u2013 steel", description: "This element encompasses steel strengthening elements applied to an existing structures beams such as external post-tensioning systems or bonded steel strips. It does not include modification of steel beams through the addition of plate to web and flanges. These are included within the original steel beam." },
    O: { title: "External strengthening \u2013 other", description: "This element encompasses Fibre Reinforced Polymer (FRP) or similar strengthening elements applied to an existing structure such as bonded strips." }
  },
  230: {
    O: { title: "Superstructure drainage", description: "This element is intended to capture any drainage systems present on the structure including through deck scuppers discharging stormwater directly below the structure or self-contained systems conveying stormwater to a controlled discharge point." }
  },
  300: {
    O: { title: "Fixed bearing \u2013 other", description: "This element defines those bearings that may provide for deflection or rotation only (no longitudinal movement) and includes steel plates bearing on concrete with or without locating pins or lugs, concrete bearing on malthoid, lead sheet or a bond breaking layer of colourless grease." }
  },
  301: {
    O: { title: "Movable bearing \u2013 other", description: "This element defines those bearings that provide for both rotation and longitudinal movements by means of roller, rocker or sliding mechanisms." }
  },
  302: {
    O: { title: "Elastomeric pad/strip bearing \u2013 other", description: "This element defines those bridge bearings constructed primarily of elastomers, with or without metal shims reinforcing the elastomer. The bearings may be free to move or have anti-sliding containment." }
  },
  303: {
    O: { title: "Spherical bearing \u2013 other", description: "This element defines those bridge bearings comprising steel plates with convex and concave surfaces combined with a low friction sliding surface." }
  },
  304: {
    O: { title: "Pot bearing \u2013 other", description: "This element defines high load bridge bearings comprising confined elastomers." }
  },
  305: {
    O: { title: "Enclosed bearing \u2013 other", description: "This element defines those bearings that are enclosed so are not open for detailed inspection." }
  },
  306: {
    O: { title: "Mortar pad/bearing pedestal \u2013 other", description: "This element defines those bearings consisting entirely of dry pack or wet boxed mortar, or high concrete pedestals greater than the nominal 50 mm thickness, unreinforced or reinforced with distribution steel. This section does not cover the packing mortar placed under a steel base plate. That mortar is covered under the relevant bearing on top of the base plate." }
  },
  307: {
    S: { title: "Restraint angle/thrust blocks \u2013 Steel", description: "This element includes the restraint angles, holding down bolts and anchor blocks used to provide lateral restraint to beams/girders. It does not include hold down fixings/restraint incorporated into bearing systems which should be covered under the associated bearing element." }
  },
  308: {
    S: { title: "Seismic restraint \u2013 Steel", description: "This element defines visible seismic linkages providing longitudinal restraint to prevent beams from dropping off supports. This element includes linkages as well as any cushioning elements." }
  },
  309: {
    S: { title: "Corbel \u2013 steel", description: "This element defines steel corbels cantilevering beyond the face of the abutment/pier to provide additional grip/bearing for beams." },
    T: { title: "Corbel \u2013 timber", description: "This element defines timber corbels cantilevering beyond the face of the abutment/pier to provide additional grip/bearing for beams." }
  },
  400: {
    S: { title: "Abutment \u2013 steel", description: "This element defines all abutments constructed of steel, including those constructed of steel piles/columns with timber, concrete or other sheeting. Wingwalls whether integral, attached or independent are considered separately under the wingwall element. Damage to seating areas beneath bearings is covered under the bearing element." },
    C: { title: "Abutment \u2013 reinforced concrete", description: "This element defines all abutments constructed of reinforced concrete and includes short integral return walls which support the barrier end posts or terminals, ballast walls and side keeper walls. Wingwalls whether integral, attached or independent are considered separately under the wingwall element. Damage to seating areas beneath bearings is covered under the bearing element." },
    T: { title: "Abutment \u2013 timber", description: "This element defines all abutments constructed of timber, including those constructed of timber piles/columns with timber, concrete or other sheeting. Wingwalls whether integral, attached or independent are considered separately under the wingwall element. Damage to seating areas beneath bearings is covered under the bearing element." },
    M: { title: "Abutment \u2013 masonry", description: "This element defines all abutments constructed of masonry and includes short integral return walls which support the barrier end posts or terminals, ballast walls and side keeper walls. It also includes any concrete caps included at the top of the abutment. Wingwalls whether integral, attached or independent are considered separately under the wingwall element. Damage to seating areas beneath bearings is covered u..." },
    O: { title: "Abutment \u2013 other", description: "This element defines all abutments constructed of any other material such as Mechanically Stabilised Earth (MSE) systems and includes concrete facing panels, anchor systems or similar. Wingwalls whether integral, attached or independent are considered separately under the wingwall element. Damage to seating areas beneath bearings is covered under the bearing element." }
  },
  401: {
    S: { title: "Wingwall \u2013 steel", description: "This element defines all wingwalls constructed of steel, including those constructed of steel piles/columns with timber, concrete or other sheeting." },
    C: { title: "Wingwall \u2013 reinforced concrete", description: "This element defines all wingwalls constructed of reinforced concrete." },
    T: { title: "Wingwall \u2013 timber", description: "This element defines all wingwalls constructed of timber, including those constructed of timber piles/columns with timber, concrete or other sheeting." },
    M: { title: "Wingwall \u2013 masonry", description: "This element defines all wingwalls constructed of masonry. It also includes any concrete caps included at the top of the wall." },
    O: { title: "Wingwall \u2013 other", description: "This element defines all wingwalls constructed of any other material such as Mechanically Stabilised Earth (MSE) systems and includes concrete facing panels, anchor systems or similar." }
  },
  402: {
    S: { title: "Pier cap \u2013 steel", description: "This element includes all steel pier caps that support the superstructure and transfer loads into piles or columns." },
    C: { title: "Pier cap \u2013 reinforced concrete", description: "This element includes all reinforced concrete pier caps that support the superstructure and transfer loads into piles/columns." },
    T: { title: "Pier cap \u2013 timber", description: "This element includes all timber pier caps that support the superstructure and transfer loads into piles/columns." }
  },
  403: {
    C: { title: "Pier wall \u2013 reinforced concrete", description: "This element describes full height pier walls constructed using reinforced concrete and includes any thickening at the top of the wall to accommodate the superstructure. If, however, this thickening cantilevers out from the walls. Damage to bearing support areas beneath bearings is covered under the bearing items. Piers which have thin infill panels between columns shall be considered under this element (with the ..." },
    M: { title: "Pier wall \u2013 masonry", description: "This element describes all full height masonry piers and shall include any reinforced concrete caps included at the top of the walls." }
  },
  404: {
    S: { title: "Column \u2013 steel", description: "This element includes all steel columns (or piles protruding above bed level) supporting a pier cap or the superstructure (directly). This element should encompass any ties, bracing or sheeting panels spanning between the columns which may be used to stiffen the columns or piles and/or to distribute loads." },
    P: { title: "Column \u2013 prestressed concrete", description: "This element includes all prestressed concrete piles protruding above bed level and supporting a pier cap or the superstructure (directly). This element should encompass any ties, bracing or sheeting panels spanning between the columns which may be used to stiffen the columns or piles and/or to distribute loads." },
    C: { title: "Column \u2013 reinforced concrete", description: "This element includes all reinforced concrete columns (or piles protruding above bed level) supporting a pier cap or the superstructure (directly). This element should encompass any ties, bracing or sheeting panels spanning between the columns which may be used to stiffen the columns or piles and/or to distribute loads." },
    T: { title: "Column \u2013 timber", description: "This element includes all timber columns (or piles protruding above bed level) supporting a pier cap or the superstructure (directly). This element should encompass any ties, bracing or sheeting panels spanning between the columns which may be used to stiffen the columns or piles and/or to distribute loads." }
  },
  405: {
    S: { title: "Column (trestle) \u2013 steel", description: "This element defines steel truss/built up towers and is intended to capture large supports and towers associated with large deck truss bridges." },
    T: { title: "Column (trestle) \u2013 timber", description: "This element defines timber truss/built up towers and is intended to capture large supports and towers associated with large deck truss bridges." }
  },
  406: {
    C: { title: "Pile cap/footing \u2013 reinforced concrete", description: "This element defines reinforced concrete pile caps/footings exposed for inspection either intentionally or because of scour." }
  },
  407: {
    S: { title: "Pile \u2013 steel", description: "This element includes all steel piles (beneath a defined pile cap)." },
    P: { title: "Pile \u2013 prestressed concrete", description: "This element includes all prestressed concrete piles (beneath a defined pile cap)." },
    C: { title: "Pile \u2013 reinforced concrete", description: "This element includes all reinforced concrete piles (beneath a defined pile cap)." },
    T: { title: "Pile \u2013 timber", description: "This element includes all timber piles (beneath a defined pile cap)." }
  },
  408: {
    S: { title: "Jacket system \u2013 steel", description: "This element encompasses includes steel jacketing systems used to encapsulate existing columns/piles." },
    C: { title: "Jacket system \u2013 reinforced concrete", description: "This element encompasses reinforced concrete jacketing systems used to encapsulate existing columns/piles." },
    O: { title: "Jacket system \u2013 other", description: "This element encompasses Fibre Reinforced Polymer (FRP) or similar strengthening elements applied to an existing structure such as bonded strips." }
  },
  500: {
    O: { title: "Waterway", description: "This element captures the waterway crossed and shall include all spans/cells above the channel, whether currently active or not." }
  },
  501: {
    O: { title: "Batter/embankment", description: "This element captures batter slopes in front of bridge abutments." }
  },
  502: {
    O: { title: "Feature crossed", description: "This element captures any feature crossed (other than waterway) including road/rail corridors, access tracks, foot/cycle paths or stock access." }
  },
  504: {
    O: { title: "Services", description: "This element captures any service supported by the structure." }
  },
  505: {
    O: { title: "Open drainage", description: "This element is intended to capture any drainage channels/systems discharging adjacent to/ near the structure (e.g. roadside drainage)." }
  },
  601: {
    S: { title: "Pipe \u2013 steel", description: "This element includes all steel pipe culvert/underpass whether buried corrugated metal (multiplate or helically wound) or rigid steel pipe. Wingwalls and headwalls whether integral, attached or independent are considered separately as are apron structures or any supplementary protection provided to the invert." },
    C: { title: "Pipe \u2013 reinforced concrete", description: "This element includes all concrete pipe culvert/underpass. Wingwalls and headwalls whether integral, attached or independent are considered separately as are apron structures or any supplementary protection provided to the invert." },
    T: { title: "Pipe \u2013 timber", description: "This element includes all timber stave culverts. Wingwalls and headwalls whether integral, attached or independent are considered separately as are apron structures or any supplementary protection provided to the invert." },
    O: { title: "Pipe \u2013 other", description: "This element includes all pipe culvert/underpass of any other material type not described above. Wingwalls and headwalls whether integral, attached or independent are considered separately as are apron structures or any supplementary protection provided to the invert." }
  },
  602: {
    S: { title: "Pipe-arch \u2013 steel", description: "This element includes all buried corrugated metal pipe-arch culvert/underpass. Wingwalls and headwalls whether integral, attached or independent are considered separately as are apron structures or any supplementary protection provided to the invert." },
    O: { title: "Pipe-arch \u2013 other", description: "This element includes all pipe-arch culverts of any other material type not described above. Wingwalls and headwalls whether integral, attached or independent are considered separately as are apron structures or any supplementary protection provided to the invert." }
  },
  603: {
    S: { title: "Arch (culvert) \u2013 steel", description: "This element includes all buried corrugated metal arch structures spanning between foundations (I.e. no floor). Wingwalls and headwalls whether integral, attached or independent are considered separately as are apron structures or any supplementary protection provided to the invert." }
  },
  604: {
    C: { title: "Invert protection \u2013 reinforced concrete", description: "This element includes all reinforced concrete invert protection systems installed through culverts. This includes inlet and outlet aprons along with any associated cut-off walls. Inlet, through barrel and outlet systems shall be treated separately." },
    O: { title: "Invert protection \u2013 other", description: "This element includes all invert protection systems installed through culverts of materials other than reinforced concrete and includes protective coating systems, steel or FRP armouring and bituminous coatings." }
  },
  605: {
    S: { title: "Wingwall \u2013 steel", description: "This element defines all wingwalls constructed of steel, including those constructed of steel piles/columns with timber, concrete or other sheeting." },
    C: { title: "Wingwall \u2013 reinforced concrete", description: "This element defines all wingwalls constructed of reinforced concrete." },
    T: { title: "Wingwall \u2013 timber", description: "This element defines all wingwalls constructed of timber, including those constructed of timber piles/columns with timber, concrete or other sheeting." },
    M: { title: "Wingwall \u2013 masonry", description: "This element defines all wingwalls constructed of masonry. It also includes any concrete caps included at the top of the wall." },
    O: { title: "Wingwall \u2013 other", description: "This element defines all wingwalls constructed of any other material such as Mechanically Stabilised Earth (MSE) systems and includes concrete facing panels, anchor systems or similar." }
  },
  606: {
    C: { title: "Headwall \u2013 reinforced concrete", description: "This element includes all reinforced concrete headwalls above culvert barrels." },
    T: { title: "Headwall \u2013 timber", description: "This element includes all timber headwalls above culvert barrels." }
  },
  607: {
    C: { title: "Footing \u2013 reinforced concrete", description: "This element defines both mass and reinforced concrete culvert footings exposed for inspection either intentionally or because of scour." }
  },
  608: {
    O: { title: "Waterdrive \u2013 other", description: "This element includes any unlined waterdrive." }
  },
  609: {
    C: { title: "Abutment (culvert) \u2013 reinforced concrete", description: "This element defines all abutments constructed of reinforced concrete and includes short integral return walls which support the barrier end posts or terminals, ballast walls and side keeper walls. Wingwalls whether integral, attached or independent are considered separately under the wingwall element. Damage to seating areas beneath bearings is covered under the bearing element." },
    M: { title: "Abutment (culvert) \u2013 masonry", description: "This element defines all abutments constructed of masonry and includes short integral return walls which support the barrier end posts or terminals, ballast walls and side keeper walls. It also includes any concrete caps included at the top of the abutment. Wingwalls whether integral, attached or independent are considered separately under the wingwall element. Damage to seating areas beneath bearings is covered u..." },
    O: { title: "Abutment (culvert) \u2013 other", description: "This element defines all abutments constructed of any other material such as Mechanically Stabilised Earth (MSE) systems and includes concrete facing panels, anchor systems or similar. Wingwalls whether integral, attached or independent are considered separately under the wingwall element. Damage to seating areas beneath bearings is covered under the bearing element." }
  },
  610: {
    S: { title: "Pile (culvert) \u2013 steel", description: "This element includes all steel piles (beneath a defined culvert abutment)." },
    P: { title: "Pile (culvert) \u2013 prestressed concrete", description: "This element includes all prestressed concrete piles (beneath a culvert abutment)." },
    C: { title: "Pile (culvert) \u2013 reinforced concrete", description: "This element includes all reinforced concrete piles (beneath a culvert abutment)." },
    T: { title: "Pile (culvert) \u2013 timber", description: "This element includes all timber piles (beneath a culvert abutment)." }
  },
}

export function categoryForElement(no: number): string {
  const hit = STANDARD_ELEMENTS.find((e) => e.no === no)
  return hit?.category ?? 'Miscellaneous'
}

export function groupLabel(group: ElementGroup, index: number): string {
  switch (group) {
    case 'abutment':
      return `A${index}`
    case 'pier':
      return `P${index}`
    case 'span':
      return `S${index}`
    case 'approach':
      return `AP${index}`
  }
}

/** Typical inspected subset used to seed a live inventory for a structure family. */
export function elementsForFamily(family: StructureFamily): StandardElement[] {
  const include = new Set<number>([
    // Carriageway
    1, 2, 3, 4,
    // Joints
    100,
    // Superstructure core
    200, 213, 230,
    // Bearings
    302, 306,
    // Substructure
    400, 401, 402, 404, 406, 407,
    // Misc
    500, 501, 502, 505,
  ])

  if (family === 'girder' || family === 'slab') {
    include.add(201)
    include.add(211)
  }
  if (family === 'box') {
    include.add(202)
    include.add(214)
  }
  if (family === 'arch') {
    include.add(205)
    include.add(207)
  }

  return STANDARD_ELEMENTS.filter((e) => include.has(e.no))
}

export function descriptionForElement(
  no: number,
  preferredMaterial: MaterialCode = 'C',
): ElementDescription | null {
  const byMat = ELEMENT_DESCRIPTIONS_BY_MATERIAL[no]
  if (byMat) {
    const preferred = byMat[preferredMaterial]
    if (preferred) return { ...preferred, material: preferredMaterial }
    const firstKey = Object.keys(byMat)[0] as MaterialCode | undefined
    if (firstKey && byMat[firstKey]) {
      return { ...byMat[firstKey]!, material: firstKey }
    }
  }
  return ELEMENT_DESCRIPTIONS[no] ?? null
}

export function materialFromBridge(material: string): MaterialCode {
  const m = material.toLowerCase()
  if (m.includes('timber') || m.includes('wood')) return 'T'
  if (m.includes('steel') || m.includes('metal')) return 'S'
  if (m.includes('prestress') || m.includes('psc')) return 'P'
  if (m.includes('masonry') || m.includes('stone')) return 'M'
  if (m.includes('concrete')) return 'C'
  return 'C'
}
