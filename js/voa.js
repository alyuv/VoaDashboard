var stationid = 'UKBB';
var displayname = 'Voa Dashboard';

var dataVoa, dataVoaSt, dataVoaPeriod, dashboardVoa, dashboardVoaPeriod1, dashboardVoaPeriod2,
    dashboardVoaPeriod3, dashboardVoaPeriod4, dashboardVoa24h_1, map;
var datasVoaPeriod = [];
var datasVoa24h = [];
var datasfVoa24h = [];
var dashboardsVoaPeriod = [];
var cookiedialog = new Boolean();

var dateTimeEnd_formater, dateTimeRec_formater, datetime_formater, time_formater, id_formater, temp_formater,
    power_formater,
    status_formater, rainsum_formater;

$(function () {

    $("#tabs").tabs();
    $("#tabs").tabs({active: 0});
    $('#tabs').click('tabsselect', function (event, ui) {
        if ($("#tabs").tabs('option', 'active') == 3 && !map) {
            //initializeMap();
        } else {
            //google.maps.event.trigger(map, 'resize');
        }
    });

    $("#accordion").accordion({heightStyle: "content", active: false, collapsible: true});

    $("#radio_units").buttonset();
    $("#radio_filter").buttonset();

    $("#radio_units").change(function () {
        $(".metric").toggle();
        $(".metric_table").toggle();
        $(".metric_gauge").toggle();
        $(".imperial").toggle();
        $(".imperial_table").toggle();
        $(".imperial_gauge").toggle();
        $("#accordion").accordion("option", "active", false);
        var unit_value = $.cookie('Units');
        if (unit_value == null && cookiedialog == false) {
            $("#dialog2").dialog("open");
            cookiedialog = true;
        } else if (unit_value != null) {
            $.cookie('Units', '' + $('input:radio[name=radio_units]:checked').val(), {expires: 365});
        }
    });

    $("#radio_filter").change(function () {
        if ($('input:radio[name=radio_filter]:checked').val() == "FilterOn")
            filterdata(true);
        else
            $("#accordion").accordion("option", "active", false);
        var filter_value = $.cookie('Filter');
        if (filter_value == null && cookiedialog == false) {
            $("#dialog2").dialog("open");
            cookiedialog = true;
        } else if (filter_value != null) {
            $.cookie('Filter', '' + $('input:radio[name=radio_filter]:checked').val(), {expires: 365});
        }
    });

    $("#setdatetime").button();
    $("#setdatetime").click(function () {
        $("#setdatetime").button("disable");
        updateDashboardPeriod();
    });

    $("#setdate").button();
    $("#setdate").click(function () {
        $("#setdate").button("disable");
        updateDashboard24h();
    });

    $("#refresh-gauges").button();
    $("#refresh-gauges").click(function () {
        $("#refresh-gauges").button("disable");
        updateGauges();
    });

    $(".refresh-charts").button();
    $(".refresh-charts").click(function () {
        $(".refresh-charts").button("disable");
        updateCharts();
    });

    $("#progressbar1").progressbar({value: false});
    $("#progressbar2").progressbar({value: false});
    $("#progressbar3").progressbar({value: false});
    $("#progressbar4").progressbar({value: false});

    $("#dialog1").dialog({
        autoOpen: false,
        resizable: false,
        modal: true,
        buttons: {
            Ok: function () {
                $(this).dialog("close");
                $("#accordion").accordion("option", "active", 1);
            }
        }
    });

    $("#dialog2").dialog({
        autoOpen: false,
        resizable: false,
        height: 160,
        modal: true,
        buttons: {
            "Allow": function () {
                $(this).dialog("close");
                $.cookie('Units', $('input:radio[name=radio_units]:checked').val(), {expires: 365});
                $.cookie('Filter', $('input:radio[name=radio_filter]:checked').val(), {expires: 365});
            },
            "Reject": function () {
                $(this).dialog("close");
            }
        }
    });

    $("#dialog3").dialog({
        autoOpen: false,
        resizable: false,
        modal: true,
        buttons: {
            Ok: function () {
                $(this).dialog("close");
                $(".progressbar-hide").hide();
                $("#setdatetime").button("enable");
            }
        }
    });

    $("#from").datepicker({
        changeMonth: true,
        numberOfMonths: 3,
        maxDate: "-1D",
        dateFormat: "yy-mm-dd",
        onClose: function (selectedDate) {
            $("#to").datepicker("option", "minDate", selectedDate);
        }
    });

    $("#to").datepicker({
        changeMonth: true,
        numberOfMonths: 3,
        maxDate: new Date,
        dateFormat: "yy-mm-dd",
        onClose: function (selectedDate) {
            $("#from").datepicker("option", "maxDate", selectedDate);
        }
    });

    $("#date").datepicker({
        changeMonth: true,
        numberOfMonths: 1,
        maxDate: new Date,
        dateFormat: "yy-mm-dd",
    });


    yesterday = new Date();

    yesterday.setDate(yesterday.getDate() - 5);
    $('input:text[name=from]').val(yesterday.getFullYear() + '-' + ('0' + (yesterday.getUTCMonth() + 1 )).slice(-2) + '-' + ('0' + yesterday.getUTCDate()).slice(-2));
    $('input:text[name=to]').val(new Date().getFullYear() + '-' + ('0' + (new Date().getUTCMonth() + 1 )).slice(-2) + '-' + ('0' + new Date().getUTCDate()).slice(-2));
    $('input:text[name=date]').val(new Date().getFullYear() + '-' + ('0' + (new Date().getUTCMonth() + 1)).slice(-2) + '-' + ('0' + new Date().getUTCDate()).slice(-2));

    $('#station-title').replaceWith('<div id="station-title">' + displayname + '</div>');

});

var stationsid = ['UKBB', 'Gostomel', 'Barysivka', 'Bila Tserkva', 'Oster'];
var mapinfo = [['Boryspil/UKBB, Ukraine', '130 м', '50.340575, 30.896833'],
    ['Gostomel/UKKM, Ukraine', '109 м', '50.590432, 30.209494'],
    ['Baryshivka, Ukraine', '102 м', '50.354854, 31.335213'],
    ['Bila Tserkva, Ukraine', '106 м', '49.78, 30.18'],
    ['Oster, Ukraine', '111 м', '50.95, 30.95']];

var mapinfo_ukbb = new Array(
    'Boryspil/UKBB, Ukraine,',
    '130m',
    '50.340575, 30.896833'
);


function initializeMap() {
    var latlon = mapinfo_ukbb[2].split(",");
    var myLatlng = new google.maps.LatLng(Number(latlon[0]), Number(latlon[1]));

    var contentString = '<div id="content"><div id="siteNotice"></div>' +
        '<h3 id="firstHeading" class="firstHeading">' + stationsid[0] + '</h3>' +
        '<div id="bodyContent"><div id="stationcontainer" style="width:300px">' +
        '<div id="stationmenu" style="width:100px;float:left;line-height:160%;">' +
        '<b>Location:</b><br /><b>Elevation:</b> <br /><b>Lat, Lon:</b> <br />' +
        '</div>' +
        '<div id="stationcontent" style="width:200px;float:left;line-height:160%;">';

    for (var i = 0, ii = mapinfo_ukbb.length; i < ii; i++) {
        contentString += mapinfo_ukbb[i] + '<br />';
    }
    contentString += '</div></div></div></div>';
    var mapOptions = {
        zoom: 9,
        center: myLatlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });
    var marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        //icon: image,
        title: 'Weather Station ' + stationid
    });
    google.maps.event.addListener(marker, 'click', function () {
        infowindow.open(map, marker);
    });

    var markers = [];
    var latlons = [];
    var LatLng = [];
    var contentStrings = [];
    var infowindow;

    for (var i = 0; i < 5; i++) {
        latlon = mapinfo[i][2].split(",");
        LatLng[i] = new google.maps.LatLng(Number(latlon[0]), Number(latlon[1]));

        contentStrings[i] = '<div id="content"><div id="siteNotice"></div>' +
            '<h3 id="firstHeading" class="firstHeading">' + stationsid[i] + '</h3>' +
            '<div id="bodyContent"><div id="stationcontainer" style="width:300px">' +
            '<div id="stationmenu" style="width:100px;float:left;line-height:160%;">' +
            '<b>Location:</b><br /><b>Elevation:</b> <br /><b><La></La>Lat, Lon:</b> <br />' +
            '</div>' +
            '<div id="stationcontent" style="width:200px;float:left;line-height:160%;">';


        for (var j = 0, jj = mapinfo[i].length; j < jj; j++) {
            contentStrings[i] += mapinfo[i][j] + '<br/>';
        }
        contentStrings[i] += '</div></div></div></div>';

        var infoWindow = new google.maps.InfoWindow(), marker, i;

        marker = new google.maps.Marker({
            position: LatLng[i],
            map: map,
            //icon: image,
            title: 'Meteo station: ' + stationsid[i]
        });

        google.maps.event.addListener(marker, 'click', (function (marker, i) {
            return function () {
                infoWindow.setContent(contentStrings[i]);
                infoWindow.open(map, marker);
            }
        })(marker, i));


    }
}


google.load('visualization', '1', {'packages': ['controls']});
google.load("visualization", "1", {'packages': ['table']});
google.load('visualization', '1', {'packages': ['corechart']});

google.setOnLoadCallback(firstRun);

function getDataVoa10m() {

    var jsonData = $.ajax({
        url: "/voa/data/get_data_10m.php",
        dataType: "json",
        async: false,
        error: function () {
            $("#dialog3").dialog("open");
        }
    }).responseText;

    dataVoa = new google.visualization.DataTable(jsonData);

    if (dataVoa.getNumberOfRows() == 0)
        $("#dialog1").dialog("open");

    datetime_formater.format(dataVoa, 2);

    id_formater.format(dataVoa, 0);
    temp_formater.format(dataVoa, 2);
    power_formater.format(dataVoa, 3);
    for (var i = 4, ii = 15; i < ii; i++) {
        rain_formater.format(dataVoa, i);
    }

}
function getDataVoaSt() {
    var jsonData = $.ajax({
        url: "/voa/data/get_data_st.php",
        dataType: "json",
        async: false,
        error: function () {
            $("#dialog3").dialog("open");
        }
    }).responseText;

    dataVoaSt = new google.visualization.DataTable(jsonData);

    if (dataVoaSt.getNumberOfRows() == 0)
        $("#dialog1").dialog("open");

    for (var i = 2, ii = 7; i <= ii; i++) {
        rain_formater.format(dataVoaSt, i);
    }

}

function localDateToUTCDate(d) {
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
}

function getDataVoaPeriod() {

    var now = new Date().getUTCHours() + ':' + new Date().getUTCMinutes();
    var current_day = new Date().getUTCFullYear() + '-' + ('0' + (new Date().getUTCMonth())).slice(-2) + '-'
        + ('0' + (new Date().getUTCDate())).slice(-2);

    var from = $('input:text[name=from]').val();
    if (current_day == $('input:text[name=to]').val()) {
        var to = $('input:text[name=to]').val() + ' ' + now;
    }
    else {
        var to = $('input:text[name=to]').val();
    }


    var id = arguments[0] + 1;
    var idvoa = arguments[0];

    // Fetch the JSON data
    var jsonData = $.ajax({
        url: "/voa/data/get_data_period.php?from=" + from + "&to=" + to + "&id=" + id,
        dataType: "json",
        async: false,
        error: function () {
            $("#dialog3").dialog("open");
        }
    }).responseText;

    datasVoaPeriod[idvoa] = new google.visualization.DataTable(jsonData);

    if (datasVoaPeriod[idvoa].getNumberOfRows() == 0)
        $("#dialog1").dialog("open");

    datetime_formater.format(datasVoaPeriod[idvoa], 0);

    for (var i = 0, ii = datasVoaPeriod[idvoa].getNumberOfRows(); i < ii; i++) {
        datasVoaPeriod[idvoa].setValue(i, 0, localDateToUTCDate(datasVoaPeriod[idvoa].getValue(i, 0)));
    }


}

function getDataVoa24h() {

    var now = new Date().getUTCHours() + ':' + new Date().getUTCMinutes();

    var current_day = new Date().getUTCFullYear() + '-' + ('0' + (new Date().getUTCMonth() + 1 )).slice(-2) + '-'
        + ('0' + (new Date().getUTCDate())).slice(-2);

    var from = $('input:text[name=date]').val() + ' 00:00';

    if (current_day == $('input:text[name=date]').val()) {
        var to = $('input:text[name=date]').val() + ' ' + now;
    }
    else {
        var to = $('input:text[name=date]').val() + ' 23:59';
    }

    var idvoa = 0;

    for (var id = 0; id < 4; id++) {
        idvoa = id + 1;
        var jsonData = $.ajax({
            url: "/voa/data/get_data_period.php?from=" + from + "&to=" + to + "&id=" + idvoa,
            dataType: "json",
            async: false,
            error: function () {
                $("#dialog3").dialog("open");
            }
        }).responseText;


        datasVoa24h[id] = new google.visualization.DataTable(jsonData);
        datasVoa24h[id].removeColumn(1);

        if (datasVoa24h[id].getNumberOfRows() == 0) {
            $("#dialog1").dialog("open");
            console.debug(datasVoa24h[id].getNumberOfRows())
        }

        else {

            time_formater.format(datasVoa24h[id], 0);

            for (var i = 0, ii = datasVoa24h[id].getNumberOfRows(); i < ii; i++) {
                datasVoa24h[id].setValue(i, 0, localDateToUTCDate(datasVoa24h[id].getValue(i, 0)));
            }

            var count = datasVoa24h[id].getNumberOfRows();
            var cnt = datasVoa24h[id].getNumberOfRows();
            var i = 0;

            do {
                if (datasVoa24h[id].getValue(count - 1, 1) == 0) {
                    datasVoa24h[id].removeRow(count - 1);
                    count--;
                }

                else {
                    count--;
                }
            }

            while (count >= 1)
        }
    }
}

function parseDate(input) {
    var parts = input.match(/(\d+)/g);
    if (parts != null && parts.length == 3)
        var stamp = Date.UTC(parts[0], parts[1] - 1, parts[2]) / 1000;
    else
        var stamp = Math.round(new Date().getTime() / 1000);
    offset = new Date().getTimezoneOffset() * 60;
    stamp = Math.round(stamp) + offset;
    return stamp;

}

function firstRun() {

    var filter_value = $.cookie('Filter');
    if (filter_value == null || filter_value == 'FilterOff') {
        $('input:radio[name=radio_filter][id=radio_filter1]').prop('checked', true).button("refresh");
    } else {
        $('input:radio[name=radio_filter][id=radio_filter2]').prop('checked', true).button("refresh");
    }

    var unit_value = $.cookie('Units');
    if (unit_value == null || unit_value == 'metric') {
        $('input:radio[name=radio_units][id=radio_units1]').prop('checked', true).button("refresh");
        $(".metric").show();
        $(".metric_table").show();
        $(".metric_gauge").show();
    } else {
        $('input:radio[name=radio_units][id=radio_units2]').prop('checked', true).button("refresh");
        $(".imperial").show();
        $(".imperial_table").show();
        $(".imperial_gauge").show();
    }

    datetime_formater = new google.visualization.DateFormat({pattern: "dd.MM.yy HH:mm:ss", timeZone: 0});
    time_formater = new google.visualization.DateFormat({pattern: "HH:mm", timeZone: 0});
    id_formater = new google.visualization.NumberFormat({fractionDigits: 0});
    temp_formater = new google.visualization.NumberFormat({fractionDigits: 1});
    power_formater = new google.visualization.NumberFormat({fractionDigits: 0});
    status_formater = new google.visualization.NumberFormat({fractionDigits: 0});
    rain_formater = new google.visualization.NumberFormat({fractionDigits: 1});

    getDataVoa10m();
    getDataVoaSt();
    for (var i = 0; i < 4; i++) {
        getDataVoaPeriod(i);
    }

    getDataVoa24h();
    drawDashboardVoa24h();

    if ($('input:radio[name=radio_filter]:checked').val() == "FilterOn")
        filterdata(false);

    drawDashboardVoa();
    dashboardVoa.draw(dataVoa);

    drawDashboardVoaSt();
    dashboardVoaSt.draw(dataVoaSt);

    drawDashboardVoaPeriod();

}

function updateDashboard() {

    $(".progressbar-hide").show();

    getDataVoa10m();
    getDataVoaSt();

    if ($('input:radio[name=radio_filter]:checked').val() == "FilterOn")
        filterdata(false);

    drawDashboardVoa();
    drawDashboardVoaSt();

    dashboardVoa.draw(dataVoa);
    dashboardVoaSt.draw(dataVoaSt);

}

function updateDashboardPeriod() {

    $(".progressbar-hide").show();

    for (var i = 0; i < 4; i++) {
        getDataVoaPeriod(i);
    }

    drawDashboardVoaPeriod();

    $("#setdatetime").button("enable");

}

function updateDashboard24h() {

    $(".progressbar-hide").show();
    getDataVoa24h();

    drawDashboardVoa24h();

    $("#setdate").button("enable");

}

function drawDashboardVoa() {

    var cssClassNames = {
        /*'headerRow': 'italic-darkblue-font large-font bold-font',
         'tableRow': '',
         'oddTableRow': 'beige-background',
         'selectedTableRow': 'orange-background large-font',
         'hoverTableRow': '',
         'headerCell': 'gold-border',
         'tableCell': '',
         'rowNumberCell': 'underline-blue-font'*/
    };

    var options = {
        sortColumn: 0,
        width: '100%',
        height: '100%',
        allowHtml: true,
        cssClassNames: cssClassNames
    };

    var tableVoa = new google.visualization.Table(document.getElementById('table_div'));
    tableVoa.draw(dataVoa, options);

    google.visualization.events.addListener(tableVoa, 'select', selectHandler);

    var strFilter = new google.visualization.ControlWrapper({
        'controlType': 'CategoryFilter',
        'containerId': 'strFilter_div',
        'options': {
            'filterColumnLabel': 'Location',
            'ui': {
                caption: 'Choose a location...  ',
            }
        },
        state: {
            value: 'Select location...'
        }
    });

    var table_voa = new google.visualization.ChartWrapper({
        chartType: 'Table',
        containerId: 'dataVoa_div',
        options: {
            sortColumn: 0

        },
        view: {
            columns: [0, 1, 2, 3, 4]
        }
    });

    dashboardVoa = new google.visualization.Dashboard(document.getElementById('dashboardVoa'));

    dashboardVoa.bind(strFilter, table_voa);
    google.visualization.events.addListener(dashboardVoa, 'ready',
        function () {
            var active = $("#accordion").accordion("option", "active");
            if (active != 2) {
                $("#accordion").accordion("option", "active", false);
                $(".progressbar-hide").hide();
                $(".refresh-charts").button("enable");
            }
        });

}

function formatDatetime(datetime) {
    var date = datetime.getDate();
    var month = datetime.getUTCMonth() /*+ 1*/;
    var hours = datetime.getHours();
    var minutes = datetime.getMinutes();

    month = month < 10 ? '0' + month : month;
    date = date < 10 ? '0' + date : date;
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;

    var strTime = hours + ':' + minutes;
    return strTime + ' ' + date + '.' + month + "." + datetime.getFullYear();
}

function drawDashboardVoaPeriod() {
    var dateTimeSlider1 = new google.visualization.ControlWrapper({
        'controlType': 'ChartRangeFilter',
        'containerId': 'dateTime1_div',
        'options': {
            'filterColumnIndex': 0,
            'ui': {
                'chartType': 'ColumnChart',
                'chartOptions': {
                    'enableInteractivity': false,
                    'chartArea': {'left': '9.5%', 'top': 0, 'width': '86%', 'height': '90%'},
                    'hAxis': {'baselineColor': 'none'},
                    'series': [{color: 'blue'}]
                },
                'chartView': {
                    'columns': [0, 2],
                },
                'minRangeSize': 7200000
            }
        }
    });


    var PrSum = 0;
    for (var i = 0, ii = datasVoaPeriod[0].getNumberOfRows(); i < ii; i++) {
        PrSum = PrSum + parseFloat(datasVoaPeriod[0].getValue(i, 2));
    }

    var rain_line_1 = new google.visualization.ChartWrapper({
        'chartType': 'ColumnChart',
        'containerId': 'rain_line_1_div',
        'options': {
            'title': 'Gostomel,  ' + '   Pr Sum=' + PrSum.toFixed(1),
            'height': '170',
            'legend': 'none',
            'vAxis': {
                viewWindow: {min: 0},
                titleTextStyle: {color: 'blue'}
            },
            'hAxis': {
                format: 'dd.MM HH.mm',
                gridlines: {
                    count: -1,
                    units: {
                        days: {format: ["dd.MM"]},
                        hours: {format: ["HH:mm"]},
                    }
                },
                minorGridlines: {
                    units: {
                        hours: {format: ["HH:mm", "ha"]},
                        minutes: {format: [":mm", ":mm"]}
                    }
                }
            },
            'series': [{color: 'blue'}]
        },
        'view': {'columns': [0, 2]}
    });

    dashboardsVoaPeriod[0] = new google.visualization.Dashboard(document.getElementById('dashboardsVoaPeriod[0]'));
    dashboardsVoaPeriod[0].bind(dateTimeSlider1, rain_line_1);
    dashboardsVoaPeriod[0].draw(datasVoaPeriod[0]);

    google.visualization.events.addListener(dashboardsVoaPeriod[0], 'ready',
        function () {
            var active = $("#accordion").accordion("option", "active");
            if (active != 2) {
                $("#accordion").accordion("option", "active", false);
                $(".progressbar-hide").hide();
                $(".refresh-charts").button("enable");
            }
        });

    var dateTimeSlider2 = new google.visualization.ControlWrapper({
        'controlType': 'ChartRangeFilter',
        'containerId': 'dateTime2_div',
        'options': {
            'filterColumnIndex': 0,
            'ui': {
                'chartType': 'ColumnChart',
                'chartOptions': {
                    'enableInteractivity': false,
                    'chartArea': {'left': '9.5%', 'top': 0, 'width': '86%', 'height': '90%'},
                    'hAxis': {'baselineColor': 'none'},
                    'series': [{color: 'green'}]
                },
                'chartView': {
                    'columns': [0, 2],
                },
                'minRangeSize': 7200000
            }
        }
    });

    PrSum = 0;
    for (var i = 0, ii = datasVoaPeriod[1].getNumberOfRows(); i < ii; i++) {
        PrSum = PrSum + parseFloat(datasVoaPeriod[1].getValue(i, 2));
    }

    var rain_line_2 = new google.visualization.ChartWrapper({
        'chartType': 'ColumnChart',
        'containerId': 'rain_line_2_div',
        'options': {
            'title': 'Baryshivka, Pr Sum=' + PrSum.toFixed(1),
            'height': '170',
            'legend': 'none',
            'vAxis': {
                'viewWindow': {min: 0},
                'titleTextStyle': {color: 'green'},
            },
            'hAxis': {
                format: 'dd.MM HH.mm',
                gridlines: {
                    count: -1,
                    units: {
                        days: {format: ["dd.MM"]},
                        hours: {format: ["HH:mm"]},
                    }
                },
                minorGridlines: {
                    units: {
                        hours: {format: ["HH:mm", "ha"]},
                        minutes: {format: [":mm", ":mm"]}
                    }
                }
            },
            'series': [{color: 'green'}]
        },
        'view': {'columns': [0, 2]}
    });

    dashboardsVoaPeriod[1] = new google.visualization.Dashboard(document.getElementById('dashboardsVoaPeriod[1]'));
    dashboardsVoaPeriod[1].bind(dateTimeSlider2, rain_line_2);

    dashboardsVoaPeriod[1].draw(datasVoaPeriod[1]);

    google.visualization.events.addListener(dashboardsVoaPeriod[1], 'ready',
        function () {
            var active = $("#accordion").accordion("option", "active");
            if (active != 2) {
                $("#accordion").accordion("option", "active", false);
                $(".progressbar-hide").hide();
                $(".refresh-charts").button("enable");
            }
        });

    var dateTimeSlider3 = new google.visualization.ControlWrapper({
        'controlType': 'ChartRangeFilter',
        'containerId': 'dateTime3_div',
        'options': {
            'filterColumnIndex': 0,
            'ui': {
                'chartType': 'ColumnChart',
                'chartOptions': {
                    'enableInteractivity': false,
                    'chartArea': {'left': '9.5%', 'top': 0, 'width': '86%', 'height': '90%'},
                    'hAxis': {'baselineColor': 'none'},
                    'series': [{color: 'DarkMagenta'}]
                },
                'chartView': {
                    'columns': [0, 2],
                },
                'minRangeSize': 7200000
            }
        }
    });

    PrSum = 0;
    for (var i = 0, ii = datasVoaPeriod[2].getNumberOfRows(); i < ii; i++) {
        PrSum = PrSum + parseFloat(datasVoaPeriod[2].getValue(i, 2));
    }
    var rain_line_3 = new google.visualization.ChartWrapper({
        'chartType': 'ColumnChart',
        'containerId': 'rain_line_3_div',
        'options': {
            'title': 'Bila Tserkva,  PrSum=' + PrSum.toFixed(1),
            'height': '170',
            'legend': 'none',
            'vAxis': {title: '', viewWindow: {min: 0}},
            'hAxis': {
                //title: 'Time line',
                format: 'dd.MM HH:mm',
                gridlines: {
                    count: -1,
                    units: {
                        days: {format: ["dd.MM"]},
                        hours: {format: ["HH:mm"]},
                    }
                },
                minorGridlines: {
                    units: {
                        hours: {format: ["HH:mm", "ha"]},
                        minutes: {format: [":mm", ":mm"]}
                    }
                }
            },
            'series': [{color: 'DarkMagenta'}]
        },
        'view': {'columns': [0, 2]}
    });

    dashboardsVoaPeriod[2] = new google.visualization.Dashboard(document.getElementById('dashboardsVoaPeriod[2]'));
    dashboardsVoaPeriod[2].bind(dateTimeSlider3, rain_line_3);
    dashboardsVoaPeriod[2].draw(datasVoaPeriod[2]);

    google.visualization.events.addListener(dashboardsVoaPeriod[2], 'ready',
        function () {
            var active = $("#accordion").accordion("option", "active");
            if (active != 2) {
                $("#accordion").accordion("option", "active", false);
                $(".progressbar-hide").hide();
                $(".refresh-charts").button("enable");
            }
        });

    var dateTimeSlider4 = new google.visualization.ControlWrapper({
        'controlType': 'ChartRangeFilter',
        'containerId': 'dateTime4_div',
        'options': {
            'filterColumnIndex': 0,
            'ui': {
                'chartType': 'ColumnChart',
                'chartOptions': {
                    'enableInteractivity': false,
                    'chartArea': {'left': '9.5%', 'top': 0, 'width': '86%', 'height': '90%'},
                    'hAxis': {'baselineColor': 'none'},
                    'series': [{color: 'LightSeaGreen'}]
                },
                'chartView': {
                    'columns': [0, 2],
                },
                'minRangeSize': 7200000
            }
        }
    });

    PrSum = 0;
    for (var i = 0, ii = datasVoaPeriod[3].getNumberOfRows(); i < ii; i++) {
        PrSum = PrSum + parseFloat(datasVoaPeriod[3].getValue(i, 2));
    }

    var rain_line_4 = new google.visualization.ChartWrapper({
        'chartType': 'ColumnChart',
        'containerId': 'rain_line_4_div',
        'options': {
            'title': 'Oster, PrSum=' + PrSum.toFixed(1),
            'height': '170',
            'legend': 'none',
            'vAxis': {title: '', viewWindow: {min: 0}},
            'hAxis': {
                format: 'dd.MM HH:mm',
                gridlines: {
                    count: -1,
                    units: {
                        days: {format: ["dd.MM"]},
                        hours: {format: ["HH:mm"]},
                    }
                },
                minorGridlines: {
                    units: {
                        hours: {format: ["HH:mm", "ha"]},
                        minutes: {format: [":mm", ":mm"]}
                    }
                }

            },
            'series': [{color: 'LightSeaGreen'}]
        },
        'view': {'columns': [0, 2]}
    });

    dashboardsVoaPeriod[3] = new google.visualization.Dashboard(document.getElementById('dashboardsVoaPeriod[3]'));
    dashboardsVoaPeriod[3].bind(dateTimeSlider4, rain_line_4);
    dashboardsVoaPeriod[3].draw(datasVoaPeriod[3]);

    google.visualization.events.addListener(dashboardsVoaPeriod[3], 'ready',
        function () {
            var active = $("#accordion").accordion("option", "active");
            if (active != 2) {
                $("#accordion").accordion("option", "active", false);
                $(".progressbar-hide").hide();
                $(".refresh-charts").button("enable");
            }
        });
}

function drawDashboardVoa24h() {
    var cssClassNames = {
        'headerRow': 'italic-darkblue-font large-font bold-font',
        'tableRow': '',
        'oddTableRow': 'beige-background',
        'selectedTableRow': 'orange-background large-font',
        'hoverTableRow': '',
        'headerCell': 'gold-border',
        'tableCell': '',
        'rowNumberCell': 'underline-blue-font'
    };

    var options = {
        title: 'Gostomel',
        aligne: top,
    };


    var tableVoa24h_1 = new google.visualization.Table(document.getElementById('table_24h_div_1'));
    tableVoa24h_1.draw(datasVoa24h[0], options);

    var tableVoa24h_2 = new google.visualization.Table(document.getElementById('table_24h_div_2'));
    tableVoa24h_2.draw(datasVoa24h[1], options);

    var tableVoa24h_3 = new google.visualization.Table(document.getElementById('table_24h_div_3'));
    tableVoa24h_3.draw(datasVoa24h[2], options);

    var tableVoa24h_4 = new google.visualization.Table(document.getElementById('table_24h_div_4'));
    tableVoa24h_4.draw(datasVoa24h[3], options);

    google.visualization.events.addListener(tableVoa24h_1, tableVoa24h_2, tableVoa24h_3, tableVoa24h_4, 'ready',
        function () {
            var active = $("#accordion").accordion("option", "active");
            if (active != 2) {
                $("#accordion").accordion("option", "active", false);
                $(".progressbar-hide").hide();
                $(".setdate").button("enable");
            }
        });

}

function drawDashboardVoaSt() {

    var strFilterSt = new google.visualization.ControlWrapper({
        'controlType': 'CategoryFilter',
        'containerId': 'strFilterSt_div',
        'options': {
            'filterColumnLabel': 'Location',
            'ui': {
                caption: 'Choose a location...  ',
            }
        },
        state: {
            value: 'Select location...'
        }
    });

    var table_voa_st = new google.visualization.ChartWrapper({
        chartType: 'Table',
        containerId: 'table_st_div',
        options: {
            sortColumn: 0

        },
        view: {
            columns: [0, 1, 2, 3, 4, 5, 6, 7]
        }
    });

    dashboardVoaSt = new google.visualization.Dashboard(document.getElementById('dashboardVoaSt'));

    dashboardVoaSt.bind(strFilterSt, table_voa_st);

    google.visualization.events.addListener(dashboardVoaSt, 'ready',
        function () {
            var active = $("#accordion").accordion("option", "active");
            if (active != 2) {
                $("#accordion").accordion("option", "active", false);
                $(".progressbar-hide").hide();
                $(".refresh-charts").button("enable");
            }
        });

}

var timeInt = 60000;
setInterval('updateDashboard()', timeInt);