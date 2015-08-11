<!DOCTYPE html>
<%@ Page language="C#" %>
<%@ Register Tagprefix="SharePoint"
Namespace="Microsoft.SharePoint.WebControls"
Assembly="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Import Namespace="Microsoft.SharePoint" %>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>SharePoint Testing</title>
    <link href="css/bootstrap.css" rel="stylesheet">

    <script type="text/javascript" src="../_layouts/MicrosoftAjax.js"></script>
    <script type="text/javascript" src="../_layouts/1033/init.js"></script>
    <script type="text/javascript" src="../_layouts/SP.Core.js"></script>
    <script type="text/javascript" src="../_layouts/1033/core.js"></script>
    <script type="text/javascript" src="../_layouts/SP.Runtime.js"></script>
    <script type="text/javascript" src="../_layouts/SP.js"></script>

    <!-- All of these may not be needed -->

    <!--<script type="text/javascript" src="../_layouts/cui.js"></script>-->
    <!--<script type="text/javascript" src="../_layouts/1033/msstring.js"></script>-->
    <!--<script type="text/javascript" src="../_layouts/search.js"></script>-->
    <style>

        body {
            background-color: #eee;
        }

        label {
            margin: 10px;
            display: block;
        }

        .the__form {
            width: 75%;
            margin: 10px auto;
        }

    </style>
</head>
<body>
<form runat="server">
        <SharePoint:FormDigest ID="FormDigest1" runat="server"></SharePoint:FormDigest>
    </form>
<div class="the__form">


    <div class="panel panel-default">
        <div class="panel-heading">
            <h3 class="panel-title">SP List Testing</h3>
        </div>
        <div class="panel-body">

                <!--<div class="well">-->
                    <!--<h4>Settings</h4>-->

                    <!--<div class="form-group">-->
                        <!--<label for="spsite_url">Site URL</label>-->
                        <!--<input type="text" class="form-control" id="spsite_url"-->
                               <!--placeholder="SP Site URL">-->
                    <!--</div>-->
                    <!--<div class="form-group">-->
                        <!--<label for="spsite_wsurl">WS Url</label>-->
                        <!--<input type="text" class="form-control"-->
                               <!--id="spsite_wsurl" placeholder="WS Url">-->
                    <!--</div>-->

                    <!--<div class="form-group">-->
                        <!--<label for="spsite_listname">List Name</label>-->
                        <!--<input type="text" class="form-control"-->
                               <!--id="spsite_listname" placeholder="List">-->
                    <!--</div>-->

                    <!--<button id='button__go' class="btn btn-primary btn-block">-->
                        <!--GO!-->
                    <!--</button>-->
                <!--</div>-->
                <div class="form-group">
                    <label for="spsite_result">Result</label>
                        <textarea rows="30" class="form-control"
                                  id="spsite_result"
                                  placeholder="Result">
                            </textarea>
                </div>

        </div>
    </div>
</div>

<!--<script type="text/javascript" src="/_layouts/15/sp.taxonomy.js"></script>-->
<script type="text/javascript" src="js/app.js"></script>

</body>
</html>