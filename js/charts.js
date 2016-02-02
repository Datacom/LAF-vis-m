var resetTabCharts 
var _data = [];
var _dictionary = {};
var council_input;
var initial_filter;


var small_chart_height = 150;

var getkeys;

//---------------------CLEANUP functions-------------------------

types = {income: [
    'Rates',
    'Regulatory income and petrol tax',
    'Current grants, subsidies, and donations income',
    'Interest income',
    'Dividend income',
    'Sales and other operating income'
  ],
  expenditure: [
    'Employee costs',
    'Depreciation and amortisation',
    'Current grants, subsidies, and donations expenditure',
    'Interest expenditure',
    'Purchases and other operating expenditure'
  ]}

function cleanup(d) {

  d.year = +d.year;
  d.val = +d.val*1000;
  d.stream = d.income;
  delete d.income;
  d.type = 0
  if (types.income.indexOf(d.stream) > -1){d.type = 1} //income
  else if(types.expenditure.indexOf(d.stream) > -1){d.type = -1} //expenditure  
  if(d.type != 0) {_data.push(d)};
}

//-Replacing the data file, resetting the filters redrawing the charts----

function newData(ndx, yearChart) {
  return function(err, data) {
    ndx.add(_data);
    yearChart.filterAll();
    initial_filter = d3.extent(yearChart.group().all(),function(d){return d.key})[1]
    yearChart.filter(initial_filter);   
    extent = yc_domain()
    yearChart.y(d3.scale.linear().domain(extent))
    dc.redrawAll();
    
    add_yearclick(yearChart)
  }
}

function add_yearclick(chart) {
  chart.selectAll('rect.bar').on('click.singleFiler', function(d,i){
        year_chart.filterAll();
        year_chart.filter(d.data.key);
        dc.redrawAll();
      })  
  
}

queue()
    .defer(d3.csv,  "data/Ashburton_District_Council.csv")
    .defer(d3.csv, "dictionary/dictionary.csv")
    .await(showCharts);

function showCharts(err, data, dictionary) {

  for (i in data) {
    data[i] = cleanup(data[i]);
  }
  
  
    for (i in dictionary) {
    entry = dictionary[i]
    council = entry.council
    _dictionary[entry.council]=entry;
  } 
  


//---------------------------------FILTERS-----------------------------------------
  ndx = crossfilter(_data); 
//-------------------------------council list dropdown-------------------------------  
  
council_list = _.keys(_dictionary)

council_input = document.getElementById("council_list");
new Awesomplete(council_input, {
    list: council_list    
});

council_input.value = council_list[0]
  
council_input.addEventListener("awesomplete-selectcomplete", function(e){
  // User made a selection from dropdown. 
  // This is fired after the selection is applied 
    dc.filterAll()
    _.map(_.pluck(year_group.all(),'key'),function(d){year_chart.filter(d)})
    ndx.remove()
    
    file = _dictionary[ e.target.value].file;
    _data = [];
    queue()
      .defer(d3.csv, 'data/' + file, cleanup)
      .await(newData(ndx,year_chart))
}, false);
  
council_input.onclick=function(e){e.target.select()}  

  
  
//---------------------------ORDINARY CHARTS --------------------------------------
  year = ndx.dimension(function(d) {return d.year});
  year_group = year.group().reduceSum(function(d){return d.val * d.type});
  initial_filter = d3.extent(year_group.all(),function(d){return d.key})[1]
  
 yc_domain = function(){
   extent = d3.extent(year_group.all(),function(d){return d.value})
   if(extent[0]>=0 && extent[1]>=0) {extent[0] = 0}
   else if (extent[0]<0 && extent[1]<0) {extent[1]=0}
   return extent
 }
  
  year_chart = dc.barChart('#year')
    .dimension(year)
    .group(year_group)
    .x(d3.scale.ordinal())
    .xUnits(dc.units.ordinal)
    .y(d3.scale.linear().domain(yc_domain()))
    .transitionDuration(200)
    .height(100)
    .colors(d3.scale.ordinal().range(["#1fb504","#eb4848"]))
    .colorAccessor(function(d){return d.value > 0})
    .elasticX(false)
    .elasticY(false)
    .centerBar(false)
    .brushOn(false)
    .on('pretransition', function(chart){
      extent = yc_domain()
      chart.y(d3.scale.linear().domain(extent))
      })
  
    year_chart.on('postRender.year', function(chart){
      chart.filter(initial_filter);
      dc.redrawAll();
      add_yearclick(chart)
      })
  
  year_chart.xAxis().ticks(4).tickFormat(d3.format('d'));
  year_chart.yAxis().ticks(2).tickFormat(d3.format('s'))
//
//  
  stream = ndx.dimension(function(d) {return d.stream});
  stream_group = stream.group().reduceSum(function(d){return d.val})
//  
  var streamcharts = generateSplitRowChart(stream, stream_group, "#income", "#expenditure", "#legend_reset", function(d) {return types.income.indexOf(d) > -1});
   
  streamcharts.chart1
    .height(200)
    .colors(d3.scale.ordinal().range(["#1fb504"]))
  
  
  streamcharts.chart2
    .height(200)
    .colors(d3.scale.ordinal().range(["#eb4848"]))
   
  
  resetStream = mergeFilters([streamcharts.chart1, streamcharts.chart2],"#LegendReset").reset;

  streamcharts.chart1.xAxis().ticks(4).tickFormat(axis_dollar_format)
  streamcharts.chart2.xAxis().ticks(4).tickFormat(axis_dollar_format)
   
  
  dc.renderAll()
}
