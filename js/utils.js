//-----------------Colours-------------------------------

// we provide a colour map for all of our charts to use. (Blair likes the default, although it needs its greys sorted as they tend to the invisible) There's a useful colour map generator at  http://tools.medialab.sciences-po.fr/iwanthue/, althought it does tend toward the 70's if your're not careful.

// Government accessability standards also require adequate leb=vels of contrast between text and background, which when the background is white/grey OR a coloured bar necessitates the use of relatively pale or unsaturated colors.    

var our_colors =

["#1fb504",
"#eb4848"]

var default_colors = d3.scale.ordinal().range(our_colors) 

// Choropleths and other maps require a colourscale. Because of the way choropleth .colorAccessor and .colourCalculator work with missing data, we need to also specify a colour for zero/missing, and a colourscale. map_zero_colour sholud be a little lighter (or whatever means "smaller" onyout chart) than the bottom value in the colourscale.

var map_zero_colour = "#f0eaca"
var colourscale = d3.scale.linear().range(["#ebdfa4","#907808"]) // grass green(for the maps)
 
// -------------Date Formats-----------------------------

var dateFormat = d3.time.format('%d/%m/%Y')
var display_dateFormat = d3.time.format('%Y-%m-%d')
//

function dim_zero_rows(chart) {
  chart.selectAll('text.row').classed('hidden',function(d){return (d.value < 0.1)});
}

function cleanChartData(precision, orderedBy) {
  return function(data){
    results = _.map(data.all(), function(a) {return {key:a.key,value:Math.abs(Math.round(a.value/precision))*precision}});
    if (orderedBy) {
      results = _.sortBy(results, orderedBy)
    }
    return results
  }
}


//-------------------axis and title formats ---------------------
var format_s = d3.format('s') //SI prefix
var format_d = d3.format('d') //integer

var integer_format = function(d){if (d==0) {return format_d(d)} 
                                 else if(d < 1){return ""} //because you can't have fractional consents
                                 else {return format_s(d)} //SI prefix 
                                } 

var title_integer_format =d3.format(',') 

var format_highdollar = d3.format('$0.3s') //values over $100
var format_highdollar_axis = d3.format('$s')
var format_10dollar   = d3.format('$0.2s') //values between $10 and $100
var format_lowdollar = d3.format('$0.2f')  // values less than $10

var axis_dollar_format = function(d){if (d != 0 && d <1) {return format_lowdollar(d)} 
                                     else { return format_highdollar_axis(d)}}

var title_dollar_format = function(d){if(d < 10){return format_lowdollar(d)} 
                                      else if (d < 100 ) {return format_10dollar(d)} 
                                      else {return format_highdollar(d)}}

var percent_format = d3.format('%')
var float_format = function(value) {return value ? d3.format('0.2f')(value):"0.00"};


//-----------------------here endith the cleanup functions-------------------------

//A bit of D3 goodness. Apply title text and legend text from file. Also, if title exists, append an i-circle.

function apply_text(_title_text) {
  for (i in _title_text){
        selection = d3.select("#"+_title_text[i].id)
        selection.select("legend").attr("title", _title_text[i].hover_text)
                                  .append("span").text(_title_text[i].legend_title + " ")
        if(_title_text[i].hover_text != ""){
           selection.select("legend").append("i").attr("class","fa fa-info-circle")
        }
  }  
}


// Make some tabs. Tabs are classed "selected" if selected, "hasFilter" if containing an active filter.


  function make_tabs(tabs){
      tab = d3.select("#tabs").selectAll("div").data(tabs).enter().append("div").attr("class","col-sm-2 tab");
      tab_reset = d3.select("#tabs")
                    .select("span.pull-right")
                    .selectAll(".reset").data(tabs).enter().append("a").attr("class","fa fa-refresh")
                                      .attr('title',function(d){ return "reset " + d.label })
                                      .classed('reset', true)
                                      .classed('hidden', true)
                                      .on('click',function(d) {
                                        d.resetFunction()
                                        d3.select(this).classed("hidden", true);
                                      });
                                   
      tab.text(function(d){return d.label});
      tab.on("click",function(d) {
        // content panel!
        d3.selectAll(".tab-pane").classed("active", false);
        d3.select('#'+d.content).classed("active", true);
        
        // tabs!
        d3.select("#tabs").selectAll("div").classed("selected", false);
        d3.select(this).classed("selected", true);
        
        //resets! (hide resets)
        thisTab = d.content
        d3.selectAll('#tabs').selectAll('.reset')
          .classed('hidden', function(d) {return d.content != thisTab || !d.chart.hasFilter()})
        
        hidden = d3.select(this).data()[0].type != "choropleth" || (projection.scale() == 1600 && JSON.stringify(projection.translate()) == JSON.stringify([220,320]))
        console.log(d3.select(this).data()[0].type)
        d3.select('#resetPosition').classed('hidden', function(){return hidden})
      });
    d3.select("#tabs").select("div").classed("selected",true) // first one selected
  }

//-----Hide reset position on Choropleth tabs if not repositioned or not in a Choropleth 

function hideReset(force) {
  d3.select('#resetPosition').classed('hidden',function(){return force || projection.scale() == 1600 && JSON.stringify(projection.translate()) == JSON.stringify([220,320])});
} 

//-----------------------------------marginize--------------------------

//fixes problem where charts overflow their divs. Should not be needed unlesschartwidths have previously been monkeyed with. Try not to monkey with chart widths in general. 

function marginize() {
  charts  = dc.chartRegistry.list();
  for (i in charts) {
    var chart = charts[i];
    if (chart.margins) {
      width = chart.width() - 30;
      chart.width(width);
    }
  }
}

//--------------------------- Complete group ---------------------------

// Sometimes you'll want all possible options to appear in a chart, regardless of whether they appear in the dataset or not.  

function generateCompleteGroup(group, mustHaveKeys, replacementValue) {
  var rv = replacementValue || 0;
  function f() {
    var data  = group.all();
    alreadyHasKey = data.map(_.property("key"))
    for (i in mustHaveKeys) {
      key = mustHaveKeys[i];
      if (!_.contains(alreadyHasKey,key)) {
        data.push({key:key,value:rv});
      }
    }
    return _.sortBy(data, function(d){return d.key});
  }
  return {
    all:f,top:f
  }
}
  
grey_undefined = function(chart) {
  chart.selectAll("text.row").classed("grey",function(d) {return d.value.not_real || d.value.count == 0})
}

grey_zero = function(chart) {
  chart.selectAll("text.row").classed("grey",function(d) {return d.value == 0})
}

//-----------------------------Generate split row charts ------------------

function generateSplitRowChart(dim, group, anchor1, anchor2, reset_id, isInFirstChart, valueAccessor,ordering) {
  //var default_colors
 
  
  valueAccessor = valueAccessor ? valueAccessor:function(d){return d.value}
  ordering = ordering ? ordering:function(d){return d.key}
  
  function isInSecondChart(d){return !isInFirstChart(d)}
  
  function isInFirstChartKey(d){return isInFirstChart(d.key)}
  
  function isInSecondChartKey(d){return !isInFirstChartKey(d)}
  
  var chart1 = dc.rowChart(anchor1);
  
  function changeValueAccessor(new_valueAccessor) {
    valueAccessor = new_valueAccessor;
    chart1.valueAccessor(new_valueAccessor);
    chart2.valueAccessor(new_valueAccessor);
  }
  
  chart1.data(function(group){
      var data = group.all()
      var extents = d3.extent(data,function(d){return valueAccessor(d)})
      extents[0] = 0;
      chart1.x(d3.scale.linear().domain(extents).range([0, chart1.effectiveWidth()]));
      return _.sortBy(_.filter(data, isInFirstChartKey),ordering);
    })
    .dimension(dim)
    .group(group)
    .valueAccessor(function(d){return valueAccessor(d)})
    .transitionDuration(200)
    .height(600)
    .colors(default_colors)
  
  chart1.xAxis().ticks(4).tickFormat(integer_format);

  var chart2 = dc.rowChart(anchor2);
    chart2.data(function(group){
      data = group.all()
      extents = d3.extent(data,function(d){return valueAccessor(d)})
      extents[0] = 0;
      chart2.x(d3.scale.linear().domain(extents).range([0, chart2.effectiveWidth()]));
      return _.sortBy(_.filter(data, isInSecondChartKey),ordering);
    })
    .dimension(dim)
    .group(group)
    .valueAccessor(function(d){return valueAccessor(d)})
    .transitionDuration(200)
    .height(600)
    .colors(default_colors)
    
  chart2.xAxis().ticks(4).tickFormat(integer_format);

  return {"chart1":chart1, "chart2":chart2, "changeValueAccessor":changeValueAccessor};
}


function mergeFilters(charts, reset_id) {
  var dim = charts[0].dimension();
  function filter_paired_charts(chart) {
    for (i in charts) {
      charts[i].on('filtered.filter_paired_charts', undefined) // stop listeners;
    }
    
    //stick all the filters on all the charts here.... 
    filters = chart.filters();
    
    for (i in charts) {
      charts[i].filterAll();
    }
    
    for (i in filters) {
      for (j in charts) {
        charts[j].filter(filters[i]);
      }
    }
    
    hasFilters = filters.length != 0
    d3.selectAll(reset_id).classed("hidden", !hasFilters);
    
    dim.filter(function(d) { return !hasFilters || _.contains(filters, d)});
    dc.redrawAll();
    for (i in charts) {
      charts[i].on('filtered.filter_paired_charts', filter_paired_charts) // stop listeners;
    }
  }
  
  d3.selectAll(reset_id).classed("hidden", true).on('click', reset);
  
  function reset() {
    for (i in charts) {
      charts[i].filterAll();
    }
    dc.redrawAll();
  }
  
  for (i in charts) {
    charts[i].on('filtered.filter_paired_charts', filter_paired_charts);
  }
  
  return {reset:reset};
}